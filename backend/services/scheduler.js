const { allQuery, runQuery } = require('../database/db');

// Check for messages that should be unlocked
const checkUnlockSchedule = async (userId = null) => {
  try {
    const now = new Date();
    let whereClause = 'WHERE is_unlocked = 0 AND unlock_at <= ?';
    let params = [now.toISOString()];
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }

    const messagesToUnlock = await allQuery(
      `SELECT message_id, user_id, title, emotional_tag, unlock_condition, self_destruct_hours
       FROM messages ${whereClause}`,
      params
    );

    const unlockedMessages = [];

    for (const message of messagesToUnlock) {
      // Unlock the message
      await runQuery(
        'UPDATE messages SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE message_id = ?',
        [message.message_id]
      );

      // Log the unlock
      await runQuery(
        'INSERT INTO unlock_logs (message_id, unlocked_by, unlock_method) VALUES (?, ?, ?)',
        [message.message_id, message.user_id, 'scheduled']
      );

      // Schedule self-destruction if applicable
      if (message.self_destruct_hours) {
        const destructAt = new Date(now.getTime() + (message.self_destruct_hours * 60 * 60 * 1000));
        // Note: In a production system, you'd want a more robust job queue
        setTimeout(async () => {
          await runQuery('DELETE FROM messages WHERE message_id = ?', [message.message_id]);
        }, message.self_destruct_hours * 60 * 60 * 1000);
      }

      unlockedMessages.push({
        messageId: message.message_id,
        userId: message.user_id,
        title: message.title,
        emotionalTag: message.emotional_tag,
        unlockCondition: message.unlock_condition
      });
    }

    return unlockedMessages;
  } catch (error) {
    console.error('Scheduler error:', error);
    throw error;
  }
};

// Check for inactivity-based unlocks
const checkInactivityUnlocks = async () => {
  try {
    const inactivityMessages = await allQuery(
      `SELECT m.message_id, m.user_id, m.unlock_value, u.last_active, m.title
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.is_unlocked = 0 AND m.unlock_condition = 'inactivity'`
    );

    const unlockedMessages = [];
    const now = new Date();

    for (const message of inactivityMessages) {
      const inactiveDays = parseInt(message.unlock_value);
      const lastActive = new Date(message.last_active);
      const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

      if (daysSinceActive >= inactiveDays) {
        await runQuery(
          'UPDATE messages SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE message_id = ?',
          [message.message_id]
        );

        await runQuery(
          'INSERT INTO unlock_logs (message_id, unlocked_by, unlock_method) VALUES (?, ?, ?)',
          [message.message_id, message.user_id, 'inactivity']
        );

        unlockedMessages.push({
          messageId: message.message_id,
          userId: message.user_id,
          title: message.title,
          reason: 'inactivity'
        });
      }
    }

    return unlockedMessages;
  } catch (error) {
    console.error('Inactivity check error:', error);
    throw error;
  }
};

// Process ripple expansion (messages becoming more public over time)
const processRippleExpansion = async () => {
  try {
    const now = new Date();
    
    const rippleMessages = await allQuery(
      `SELECT message_id, visibility FROM messages 
       WHERE ripple_expansion_date <= ? AND visibility = 'ripple'`,
      [now.toISOString()]
    );

    for (const message of rippleMessages) {
      await runQuery(
        'UPDATE messages SET visibility = ? WHERE message_id = ?',
        ['public', message.message_id]
      );
    }

    return rippleMessages.length;
  } catch (error) {
    console.error('Ripple expansion error:', error);
    throw error;
  }
};

// Unlock next message in nested sequence
const unlockNextInSequence = async (parentMessageId) => {
  try {
    const nextMessage = await allQuery(
      `SELECT message_id FROM messages 
       WHERE parent_message_id = ? AND is_unlocked = 0 
       ORDER BY sequence_order ASC LIMIT 1`,
      [parentMessageId]
    );

    if (nextMessage.length > 0) {
      await runQuery(
        'UPDATE messages SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE message_id = ?',
        [nextMessage[0].message_id]
      );

      return nextMessage[0].message_id;
    }

    return null;
  } catch (error) {
    console.error('Sequence unlock error:', error);
    throw error;
  }
};

module.exports = {
  checkUnlockSchedule,
  checkInactivityUnlocks,
  processRippleExpansion,
  unlockNextInSequence
};