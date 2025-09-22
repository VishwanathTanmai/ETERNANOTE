const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getCollisionWall, generateCollisionInsights } = require('../services/collisions');

const router = express.Router();

// Get collision wall for specific date
router.get('/collision/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const collisionWall = await getCollisionWall(req.user.user_id, date);
    
    if (!collisionWall) {
      return res.json({ collision: null, messages: [] });
    }

    res.json(collisionWall);
  } catch (error) {
    console.error('Collision wall error:', error);
    res.status(500).json({ error: 'Failed to fetch collision wall' });
  }
});

// Get collision insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const insights = await generateCollisionInsights(req.user.user_id, parseInt(timeframe));
    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Create reflection reply (delayed response to a message)
router.post('/reflection-reply', authenticateToken, async (req, res) => {
  try {
    const { messageId, content, scheduledFor } = req.body;
    
    // Verify the original message exists and user has access
    const originalMessage = await getQuery(
      `SELECT * FROM messages WHERE message_id = ? AND 
       (user_id = ? OR recipient_id = ? OR visibility = 'public')`,
      [messageId, req.user.user_id, req.user.user_id]
    );

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const result = await runQuery(
      `INSERT INTO social_interactions (message_id, user_id, interaction_type, content_encrypted, scheduled_for)
       VALUES (?, ?, ?, ?, ?)`,
      [messageId, req.user.user_id, 'reflection_reply', JSON.stringify(content), scheduledFor]
    );

    res.status(201).json({
      message: 'Reflection reply scheduled',
      interactionId: result.id,
      scheduledFor
    });
  } catch (error) {
    console.error('Reflection reply error:', error);
    res.status(500).json({ error: 'Failed to create reflection reply' });
  }
});

// Get generational threads
router.get('/threads', authenticateToken, async (req, res) => {
  try {
    const threads = await allQuery(
      `SELECT gt.*, tp.role, u.username as creator_name
       FROM generational_threads gt
       JOIN thread_participants tp ON gt.thread_id = tp.thread_id
       JOIN users u ON gt.creator_id = u.user_id
       WHERE tp.user_id = ?
       ORDER BY gt.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ threads });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Create generational thread
router.post('/threads', authenticateToken, async (req, res) => {
  try {
    const { threadName, familyName, isPublic } = req.body;

    const result = await runQuery(
      `INSERT INTO generational_threads (thread_name, family_name, creator_id, is_public)
       VALUES (?, ?, ?, ?)`,
      [threadName, familyName || null, req.user.user_id, isPublic || false]
    );

    // Add creator as admin
    await runQuery(
      `INSERT INTO thread_participants (thread_id, user_id, role)
       VALUES (?, ?, ?)`,
      [result.id, req.user.user_id, 'creator']
    );

    res.status(201).json({
      message: 'Generational thread created',
      threadId: result.id
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Join generational thread
router.post('/threads/:threadId/join', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Check if thread exists and is public or user is invited
    const thread = await getQuery(
      'SELECT * FROM generational_threads WHERE thread_id = ?',
      [threadId]
    );

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Check if already a participant
    const existingParticipant = await getQuery(
      'SELECT * FROM thread_participants WHERE thread_id = ? AND user_id = ?',
      [threadId, req.user.user_id]
    );

    if (existingParticipant) {
      return res.status(400).json({ error: 'Already a participant' });
    }

    await runQuery(
      `INSERT INTO thread_participants (thread_id, user_id, role)
       VALUES (?, ?, ?)`,
      [threadId, req.user.user_id, 'member']
    );

    res.json({ message: 'Joined thread successfully' });
  } catch (error) {
    console.error('Join thread error:', error);
    res.status(500).json({ error: 'Failed to join thread' });
  }
});

// Get public feed (ripple and public messages)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await allQuery(
      `SELECT m.message_id, m.title, m.emotional_tag, m.unlocked_at, m.view_count,
              u.username, u.profile_image
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.visibility IN ('public', 'ripple') AND m.is_unlocked = 1
       ORDER BY m.unlocked_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({ messages, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get emotional analytics
router.get('/emotions/analytics', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await allQuery(
      `SELECT date, dominant_emotion, emotion_scores, message_count, reflection_count
       FROM emotional_analytics 
       WHERE user_id = ? AND date >= ?
       ORDER BY date DESC`,
      [req.user.user_id, startDate.toISOString().split('T')[0]]
    );

    // Calculate overall emotional trends
    const emotionTotals = {};
    let totalMessages = 0;

    analytics.forEach(day => {
      if (day.emotion_scores) {
        const scores = JSON.parse(day.emotion_scores);
        Object.keys(scores).forEach(emotion => {
          emotionTotals[emotion] = (emotionTotals[emotion] || 0) + scores[emotion];
        });
      }
      totalMessages += day.message_count;
    });

    res.json({
      dailyAnalytics: analytics,
      overallTrends: emotionTotals,
      totalMessages,
      timeframe: parseInt(days)
    });
  } catch (error) {
    console.error('Emotional analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch emotional analytics' });
  }
});

// Create ripple effect (expand message visibility)
router.post('/ripple/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { expansionDate } = req.body;

    // Verify message ownership
    const message = await getQuery(
      'SELECT * FROM messages WHERE message_id = ? AND user_id = ?',
      [messageId, req.user.user_id]
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await runQuery(
      `UPDATE messages SET visibility = 'ripple', ripple_expansion_date = ? 
       WHERE message_id = ?`,
      [expansionDate, messageId]
    );

    // Log the ripple interaction
    await runQuery(
      `INSERT INTO social_interactions (message_id, user_id, interaction_type, scheduled_for)
       VALUES (?, ?, ?, ?)`,
      [messageId, req.user.user_id, 'ripple', expansionDate]
    );

    res.json({ message: 'Ripple effect scheduled', expansionDate });
  } catch (error) {
    console.error('Ripple error:', error);
    res.status(500).json({ error: 'Failed to create ripple effect' });
  }
});

// Get today's collisions
router.get('/collisions/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const collisions = await allQuery(
      `SELECT * FROM memory_collisions 
       WHERE user_id = ? AND collision_date = ?
       ORDER BY created_at DESC`,
      [req.user.user_id, today]
    );
    res.json({ collisions });
  } catch (error) {
    console.error('Today collisions error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s collisions' });
  }
});

// Get collision history
router.get('/collisions/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const collisions = await allQuery(
      `SELECT * FROM memory_collisions 
       WHERE user_id = ? 
       ORDER BY collision_date DESC 
       LIMIT ?`,
      [req.user.user_id, parseInt(limit)]
    );
    res.json({ collisions });
  } catch (error) {
    console.error('Collision history error:', error);
    res.status(500).json({ error: 'Failed to fetch collision history' });
  }
});

// Get serendipitous connections for a date
router.get('/connections/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Find public messages with same emotional tags unlocking on the same date
    const connections = await allQuery(
      `SELECT emotional_tag, COUNT(DISTINCT user_id) as userCount, 
              COUNT(*) as messageCount
       FROM messages 
       WHERE date(unlocked_at) = ? AND visibility = 'public' 
       AND emotional_tag IS NOT NULL AND user_id != ?
       GROUP BY emotional_tag 
       HAVING userCount > 1`,
      [date, req.user.user_id]
    );
    
    res.json({ connections });
  } catch (error) {
    console.error('Serendipitous connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

module.exports = router;