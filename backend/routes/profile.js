const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { generateKeyPair } = require('../utils/encryption');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(
      `SELECT user_id, username, email, profile_image, bio, birth_date, 
              created_at, last_active, legacy_mode
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );

    // Get user statistics
    const stats = await getQuery(
      `SELECT 
         COUNT(CASE WHEN is_unlocked = 0 THEN 1 END) as locked_messages,
         COUNT(CASE WHEN is_unlocked = 1 THEN 1 END) as unlocked_messages,
         COUNT(*) as total_messages
       FROM messages WHERE user_id = ?`,
      [req.user.user_id]
    );

    // Get badges
    const badges = await allQuery(
      'SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC',
      [req.user.user_id]
    );

    res.json({
      user,
      stats,
      badges
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { bio, profileImage } = req.body;

    await runQuery(
      'UPDATE users SET bio = ?, profile_image = ? WHERE user_id = ?',
      [bio || null, profileImage || null, req.user.user_id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get trusted contacts
router.get('/trusted-contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await allQuery(
      `SELECT contact_id, name, email, phone, relationship, 
              emergency_contact, created_at
       FROM trusted_contacts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.user_id]
    );

    res.json({ contacts });
  } catch (error) {
    console.error('Trusted contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch trusted contacts' });
  }
});

// Add trusted contact
router.post('/trusted-contacts', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, relationship, emergencyContact, accessRights } = req.body;

    // Generate key pair for this contact
    const { publicKey, privateKey } = generateKeyPair();

    const result = await runQuery(
      `INSERT INTO trusted_contacts 
       (user_id, name, email, phone, secondary_key, access_rights, relationship, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        name,
        email || null,
        phone || null,
        privateKey, // Store private key for user, share public key with contact
        JSON.stringify(accessRights || {}),
        relationship,
        emergencyContact || false
      ]
    );

    res.status(201).json({
      message: 'Trusted contact added',
      contactId: result.id,
      publicKey // Return public key to share with contact
    });
  } catch (error) {
    console.error('Add trusted contact error:', error);
    res.status(500).json({ error: 'Failed to add trusted contact' });
  }
});

// Enable legacy mode
router.post('/legacy-mode', authenticateToken, async (req, res) => {
  try {
    const { enable } = req.body;

    await runQuery(
      'UPDATE users SET legacy_mode = ? WHERE user_id = ?',
      [enable ? 1 : 0, req.user.user_id]
    );

    res.json({ 
      message: `Legacy mode ${enable ? 'enabled' : 'disabled'}`,
      legacyMode: enable
    });
  } catch (error) {
    console.error('Legacy mode error:', error);
    res.status(500).json({ error: 'Failed to update legacy mode' });
  }
});

// Get user badges and achievements
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const badges = await allQuery(
      'SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC',
      [req.user.user_id]
    );

    // Check for new badges to award
    await checkAndAwardBadges(req.user.user_id);

    res.json({ badges });
  } catch (error) {
    console.error('Badges error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Award badge system
const checkAndAwardBadges = async (userId) => {
  try {
    // Longevity badge - user active for 1 year
    const userAge = await getQuery(
      `SELECT JULIANDAY('now') - JULIANDAY(created_at) as days_active 
       FROM users WHERE user_id = ?`,
      [userId]
    );

    if (userAge && userAge.days_active >= 365) {
      const existingBadge = await getQuery(
        'SELECT * FROM user_badges WHERE user_id = ? AND badge_type = ?',
        [userId, 'longevity_1year']
      );

      if (!existingBadge) {
        await runQuery(
          `INSERT INTO user_badges (user_id, badge_type, badge_name, description)
           VALUES (?, ?, ?, ?)`,
          [userId, 'longevity_1year', 'Time Keeper', 'Active for one full year']
        );
      }
    }

    // Creative badge - 50+ messages created
    const messageCount = await getQuery(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ?',
      [userId]
    );

    if (messageCount && messageCount.count >= 50) {
      const existingBadge = await getQuery(
        'SELECT * FROM user_badges WHERE user_id = ? AND badge_type = ?',
        [userId, 'creative_50']
      );

      if (!existingBadge) {
        await runQuery(
          `INSERT INTO user_badges (user_id, badge_type, badge_name, description)
           VALUES (?, ?, ?, ?)`,
          [userId, 'creative_50', 'Message Weaver', 'Created 50 time capsules']
        );
      }
    }

    // Generational badge - messages spanning 10+ years
    const timeSpan = await getQuery(
      `SELECT MAX(JULIANDAY(unlock_at)) - MIN(JULIANDAY(unlock_at)) as span_days
       FROM messages WHERE user_id = ? AND unlock_at IS NOT NULL`,
      [userId]
    );

    if (timeSpan && timeSpan.span_days >= 3650) { // 10 years
      const existingBadge = await getQuery(
        'SELECT * FROM user_badges WHERE user_id = ? AND badge_type = ?',
        [userId, 'generational_10year']
      );

      if (!existingBadge) {
        await runQuery(
          `INSERT INTO user_badges (user_id, badge_type, badge_name, description)
           VALUES (?, ?, ?, ?)`,
          [userId, 'generational_10year', 'Decade Dreamer', 'Messages spanning 10+ years']
        );
      }
    }
  } catch (error) {
    console.error('Badge check error:', error);
  }
};

// Get emotional journey
router.get('/emotional-journey', authenticateToken, async (req, res) => {
  try {
    const { timeframe = 365 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const journey = await allQuery(
      `SELECT date, emotion_scores, message_count FROM emotional_analytics 
       WHERE user_id = ? AND date >= ? ORDER BY date ASC`,
      [req.user.user_id, startDate.toISOString().split('T')[0]]
    );

    // Process recent emotions for display
    const recentEmotions = {};
    let totalMessages = 0;
    
    journey.forEach(entry => {
      const scores = JSON.parse(entry.emotion_scores || '{}');
      Object.keys(scores).forEach(emotion => {
        recentEmotions[emotion] = (recentEmotions[emotion] || 0) + scores[emotion];
      });
      totalMessages += entry.message_count;
    });
    
    // Convert to percentage and format for frontend
    const emotionArray = Object.keys(recentEmotions).map(emotion => ({
      type: emotion,
      count: recentEmotions[emotion],
      percentage: totalMessages > 0 ? Math.round((recentEmotions[emotion] / totalMessages) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    res.json({ 
      journey: emotionArray,
      recentEmotions: emotionArray,
      timeframe: parseInt(timeframe),
      totalMessages
    });
  } catch (error) {
    console.error('Emotional journey error:', error);
    res.status(500).json({ error: 'Failed to fetch emotional journey' });
  }
});

module.exports = router;