const bcrypt = require('bcryptjs');
const { runQuery, initDatabase } = require('./database/db');
const { generateKey } = require('./utils/encryption');

async function createTestUser() {
  try {
    await initDatabase();
    
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'password123';
    
    const passwordHash = await bcrypt.hash(password, 10);
    const masterKey = generateKey();
    
    const result = await runQuery(
      `INSERT INTO users (username, email, password_hash, master_key) 
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, masterKey]
    );
    
    console.log('Test user created:', {
      id: result.id,
      username,
      email,
      masterKey
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();