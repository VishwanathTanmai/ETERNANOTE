const { allQuery, runQuery } = require('../database/db');

// Detect memory collisions (multiple messages unlocking on same day)
const detectCollisions = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find users with multiple messages unlocking today
    const collisionCandidates = await allQuery(
      `SELECT user_id, COUNT(*) as message_count, 
              GROUP_CONCAT(message_id) as message_ids,
              GROUP_CONCAT(emotional_tag) as emotions
       FROM messages 
       WHERE date(unlocked_at) = ? AND is_unlocked = 1
       GROUP BY user_id 
       HAVING message_count > 1`,
      [today]
    );

    const collisions = [];

    for (const candidate of collisionCandidates) {
      const messageIds = candidate.message_ids ? candidate.message_ids.split(',').map(id => parseInt(id)) : [];
      const emotions = candidate.emotions ? candidate.emotions.split(',').filter(e => e && e !== 'null') : [];
      
      // Determine collision theme based on emotions
      const emotionCounts = {};
      emotions.forEach(emotion => {
        if (emotion) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      });
      
      const emotionKeys = Object.keys(emotionCounts);
      const dominantEmotion = emotionKeys.length > 0 
        ? emotionKeys.reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
        : 'mixed';
      
      const themes = {
        'happy': 'Joyful Convergence',
        'love': 'Love Collision',
        'regret': 'Reflection Nexus',
        'proud': 'Achievement Alignment',
        'hope': 'Future Visions',
        'wisdom': 'Wisdom Convergence',
        'mixed': 'Emotional Kaleidoscope'
      };

      // Create collision record
      const result = await runQuery(
        `INSERT INTO memory_collisions (collision_date, user_id, message_ids, collision_theme)
         VALUES (?, ?, ?, ?)`,
        [today, candidate.user_id, JSON.stringify(messageIds), themes[dominantEmotion] || themes.mixed]
      );

      collisions.push({
        collisionId: result.id,
        userId: candidate.user_id,
        messageCount: candidate.message_count,
        theme: themes[dominantEmotion] || themes.mixed,
        messageIds: messageIds,
        date: today
      });
    }

    return collisions;
  } catch (error) {
    console.error('Collision detection error:', error);
    throw error;
  }
};

// Get collision wall for a specific date
const getCollisionWall = async (userId, date) => {
  try {
    const collision = await allQuery(
      `SELECT * FROM memory_collisions 
       WHERE user_id = ? AND collision_date = ?`,
      [userId, date]
    );

    if (collision.length === 0) {
      return null;
    }

    const messageIds = JSON.parse(collision[0].message_ids || '[]');
    
    if (messageIds.length === 0) {
      return {
        collision: collision[0],
        messages: []
      };
    }
    
    // Get full message details
    const messages = await allQuery(
      `SELECT message_id, title, emotional_tag, created_at, unlocked_at, content_encrypted
       FROM messages 
       WHERE message_id IN (${messageIds.map(() => '?').join(',')})
       ORDER BY unlocked_at ASC`,
      messageIds
    );

    return {
      collision: collision[0],
      messages: messages
    };
  } catch (error) {
    console.error('Get collision wall error:', error);
    throw error;
  }
};

// Create serendipitous connections between users
const createSerendipitousConnections = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find public messages with same emotional tags unlocking today
    const connections = await allQuery(
      `SELECT emotional_tag, GROUP_CONCAT(user_id) as users, 
              GROUP_CONCAT(message_id) as messages
       FROM messages 
       WHERE date(unlocked_at) = ? AND visibility = 'public' 
       AND emotional_tag IS NOT NULL
       GROUP BY emotional_tag 
       HAVING COUNT(DISTINCT user_id) > 1`,
      [today]
    );

    const serendipitousConnections = [];

    for (const connection of connections) {
      const userIds = connection.users ? connection.users.split(',').map(id => parseInt(id)) : [];
      const messageIds = connection.messages ? connection.messages.split(',').map(id => parseInt(id)) : [];
      
      serendipitousConnections.push({
        emotionalTag: connection.emotional_tag,
        connectedUsers: userIds,
        messages: messageIds,
        date: today,
        type: 'emotional_resonance'
      });
    }

    return serendipitousConnections;
  } catch (error) {
    console.error('Serendipitous connections error:', error);
    throw error;
  }
};

// Generate collision insights
const generateCollisionInsights = async (userId, timeframe = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);
    
    const collisions = await allQuery(
      `SELECT collision_date, collision_theme, message_ids
       FROM memory_collisions 
       WHERE user_id = ? AND collision_date >= ?
       ORDER BY collision_date DESC`,
      [userId, startDate.toISOString().split('T')[0]]
    );

    const insights = {
      totalCollisions: collisions.length,
      themes: {},
      patterns: [],
      emotionalJourney: []
    };

    // Analyze themes
    collisions.forEach(collision => {
      insights.themes[collision.collision_theme] = 
        (insights.themes[collision.collision_theme] || 0) + 1;
    });

    // Detect patterns (e.g., weekly collisions, seasonal themes)
    const collisionDates = collisions.map(c => new Date(c.collision_date));
    const dayOfWeekCounts = {};
    
    collisionDates.forEach(date => {
      const dayOfWeek = date.getDay();
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    const mostCommonDay = Object.keys(dayOfWeekCounts).reduce((a, b) => 
      dayOfWeekCounts[a] > dayOfWeekCounts[b] ? a : b, 0
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (dayOfWeekCounts[mostCommonDay] > 1) {
      insights.patterns.push({
        type: 'weekly_pattern',
        description: `Most collisions occur on ${dayNames[mostCommonDay]}s`,
        frequency: dayOfWeekCounts[mostCommonDay]
      });
    }

    return insights;
  } catch (error) {
    console.error('Collision insights error:', error);
    throw error;
  }
};

module.exports = {
  detectCollisions,
  getCollisionWall,
  createSerendipitousConnections,
  generateCollisionInsights
};