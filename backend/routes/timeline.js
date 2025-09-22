const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get parallel timelines
router.get('/', authenticateToken, async (req, res) => {
  try {
    const timelines = await allQuery(
      'SELECT * FROM parallel_timelines WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );

    res.json({ timelines });
  } catch (error) {
    console.error('Get timelines error:', error);
    res.status(500).json({ error: 'Failed to fetch timelines' });
  }
});

// Create parallel timeline
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { timelineName, description } = req.body;

    const result = await runQuery(
      'INSERT INTO parallel_timelines (user_id, timeline_name, description) VALUES (?, ?, ?)',
      [req.user.user_id, timelineName, description || null]
    );

    res.status(201).json({
      message: 'Parallel timeline created',
      timelineId: result.id
    });
  } catch (error) {
    console.error('Create timeline error:', error);
    res.status(500).json({ error: 'Failed to create timeline' });
  }
});

// Get timeline messages
router.get('/:timelineId/messages', authenticateToken, async (req, res) => {
  try {
    const { timelineId } = req.params;

    const messages = await allQuery(
      `SELECT tm.*, m.title, m.emotional_tag, m.created_at, m.is_unlocked
       FROM timeline_messages tm
       JOIN messages m ON tm.message_id = m.message_id
       WHERE tm.timeline_id = ? AND m.user_id = ?
       ORDER BY tm.speculative_date ASC`,
      [timelineId, req.user.user_id]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Timeline messages error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline messages' });
  }
});

module.exports = router;