const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { encryptContent, decryptContent } = require('../utils/encryption');

const router = express.Router();

// Create time-locked message
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('Creating message with data:', req.body);
    console.log('User:', req.user);
    
    const {
      title,
      content,
      unlockCondition,
      unlockValue,
      messageType = 'text',
      recipientType = 'self',
      emotionalTag = null
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || !content.text) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (!unlockCondition || !unlockValue) {
      return res.status(400).json({ error: 'Unlock condition and value are required' });
    }

    // Simple content storage (no encryption for now)
    const contentStr = JSON.stringify(content);
    
    // Calculate unlock date
    let unlockAt = null;
    if (unlockCondition === 'date') {
      unlockAt = unlockValue;
    }

    const result = await runQuery(
      `INSERT INTO messages (
        user_id, recipient_type, message_type, title,
        content_encrypted, unlock_condition, unlock_value, emotional_tag, unlock_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        recipientType,
        messageType,
        title,
        contentStr,
        unlockCondition,
        unlockValue,
        emotionalTag,
        unlockAt
      ]
    );

    // Update emotional analytics
    if (emotionalTag) {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if entry exists for today
      const existingEntry = await getQuery(
        'SELECT * FROM emotional_analytics WHERE user_id = ? AND date = ?',
        [req.user.user_id, today]
      );
      
      if (existingEntry) {
        // Update existing entry
        const scores = JSON.parse(existingEntry.emotion_scores || '{}');
        scores[emotionalTag] = (scores[emotionalTag] || 0) + 1;
        
        await runQuery(
          'UPDATE emotional_analytics SET emotion_scores = ?, message_count = message_count + 1 WHERE user_id = ? AND date = ?',
          [JSON.stringify(scores), req.user.user_id, today]
        );
      } else {
        // Create new entry
        const scores = { [emotionalTag]: 1 };
        await runQuery(
          'INSERT INTO emotional_analytics (user_id, date, dominant_emotion, emotion_scores, message_count) VALUES (?, ?, ?, ?, ?)',
          [req.user.user_id, today, emotionalTag, JSON.stringify(scores), 1]
        );
      }
    }

    // Trigger AI memory weaving for the new message
    const aiMemoryWeaver = require('../services/aiMemoryWeaving');
    setTimeout(() => {
      aiMemoryWeaver.createMemoryLinks(result.id, req.user.user_id);
    }, 1000);
    
    res.status(201).json({
      message: 'Time capsule created successfully',
      messageId: result.id,
      unlockAt
    });
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: 'Failed to create message: ' + error.message });
  }
});

// Get user's messages
router.get('/my-messages', authenticateToken, async (req, res) => {
  try {
    const { status = 'all', type = 'all' } = req.query;
    
    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.user_id];
    
    if (status === 'locked') {
      whereClause += ' AND is_unlocked = 0';
    } else if (status === 'unlocked') {
      whereClause += ' AND is_unlocked = 1';
    }
    
    if (type !== 'all') {
      whereClause += ' AND message_type = ?';
      params.push(type);
    }

    const messages = await allQuery(
      `SELECT message_id, title, message_type, emotional_tag, unlock_condition,
              unlock_at, created_at, is_unlocked, view_count, visibility
       FROM messages ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get specific message content (if unlocked)
router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await getQuery(
      `SELECT * FROM messages WHERE message_id = ? AND 
       (user_id = ? OR recipient_id = ? OR visibility = 'public')`,
      [messageId, req.user.user_id, req.user.user_id]
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if message should be unlocked
    const now = new Date();
    if (!message.is_unlocked && message.unlock_at && new Date(message.unlock_at) <= now) {
      await runQuery(
        'UPDATE messages SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE message_id = ?',
        [messageId]
      );
      message.is_unlocked = 1;
    }

    if (!message.is_unlocked) {
      return res.json({
        message: {
          id: message.message_id,
          title: message.title,
          emotionalTag: message.emotional_tag,
          unlockAt: message.unlock_at,
          isLocked: true
        }
      });
    }

    // Decrypt content
    const encryptedData = JSON.parse(message.content_encrypted);
    const decryptedContent = decryptContent(encryptedData, req.user.master_key);
    
    // Update view count
    await runQuery(
      'UPDATE messages SET view_count = view_count + 1 WHERE message_id = ?',
      [messageId]
    );

    // Log unlock
    await runQuery(
      'INSERT INTO unlock_logs (message_id, unlocked_by, unlock_method) VALUES (?, ?, ?)',
      [messageId, req.user.user_id, 'manual']
    );

    res.json({
      message: {
        id: message.message_id,
        title: message.title,
        content: JSON.parse(decryptedContent),
        messageType: message.message_type,
        emotionalTag: message.emotional_tag,
        createdAt: message.created_at,
        unlockedAt: message.unlocked_at,
        viewCount: message.view_count + 1
      }
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Get today's unlocked messages (Echo mode)
router.get('/echo/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const messages = await allQuery(
      `SELECT m.*, u.username as sender_username
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.user_id
       WHERE date(m.unlocked_at) = ? 
       AND (m.user_id = ? OR m.recipient_id = ? OR m.visibility = 'public')
       AND m.is_unlocked = 1
       ORDER BY m.unlocked_at DESC`,
      [today, req.user.user_id, req.user.user_id]
    );

    const decryptedMessages = [];
    for (const message of messages) {
      try {
        const encryptedData = JSON.parse(message.content_encrypted);
        const decryptedContent = decryptContent(encryptedData, req.user.master_key);
        
        decryptedMessages.push({
          id: message.message_id,
          title: message.title,
          content: JSON.parse(decryptedContent),
          emotionalTag: message.emotional_tag,
          senderUsername: message.sender_username,
          unlockedAt: message.unlocked_at
        });
      } catch (decryptError) {
        // Skip messages that can't be decrypted
        continue;
      }
    }

    res.json({ messages: decryptedMessages });
  } catch (error) {
    console.error('Echo mode error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s messages' });
  }
});

// Create nested message sequence
router.post('/nested', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body; // Array of messages with sequence order
    
    let parentId = null;
    const createdMessages = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const encryptedData = encryptContent(JSON.stringify(msg.content), req.user.master_key);
      
      let unlockAt = null;
      if (msg.unlockCondition === 'date') {
        unlockAt = new Date(msg.unlockValue);
      }

      const result = await runQuery(
        `INSERT INTO messages (
          user_id, recipient_type, recipient_id, message_type, title,
          content_encrypted, unlock_condition, unlock_value, emotional_tag,
          is_nested, parent_message_id, sequence_order, unlock_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.user_id,
          msg.recipientType,
          msg.recipientId || null,
          msg.messageType,
          msg.title,
          JSON.stringify(encryptedData),
          msg.unlockCondition,
          msg.unlockValue,
          msg.emotionalTag,
          1,
          parentId,
          i + 1,
          unlockAt
        ]
      );

      if (i === 0) {
        parentId = result.id;
      }

      createdMessages.push({
        id: result.id,
        sequenceOrder: i + 1,
        unlockAt
      });
    }

    res.status(201).json({
      message: 'Nested message sequence created',
      messages: createdMessages
    });
  } catch (error) {
    console.error('Nested message error:', error);
    res.status(500).json({ error: 'Failed to create nested messages' });
  }
});

module.exports = router;