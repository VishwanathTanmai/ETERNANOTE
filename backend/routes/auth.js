const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getQuery } = require('../database/db');
const { generateToken } = require('../middleware/auth');
const { generateKey } = require('../utils/encryption');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, birthDate } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await getQuery(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password and generate master key
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const masterKey = generateKey();
    
    console.log('Creating user with master key:', masterKey);

    // Create user
    const result = await runQuery(
      `INSERT INTO users (username, email, password_hash, master_key, birth_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, passwordHash, masterKey, birthDate || null]
    );

    const token = generateToken(result.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.id,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await getQuery(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await runQuery(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    const token = generateToken(user.user_id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        profileImage: user.profile_image,
        bio: user.bio,
        masterKey: user.master_key
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getQuery('SELECT * FROM users WHERE user_id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        profileImage: user.profile_image,
        bio: user.bio,
        masterKey: user.master_key
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;