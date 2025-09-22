const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Generate a random encryption key
const generateKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

// Encrypt content with user's master key
const encryptContent = (content, masterKey) => {
  try {
    const key = Buffer.from(masterKey, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm: 'aes-256-cbc'
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

// Decrypt content with user's master key
const decryptContent = (encryptedData, masterKey) => {
  try {
    const key = Buffer.from(masterKey, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

// Generate RSA key pair for trusted contacts
const generateKeyPair = () => {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
};

// Encrypt with RSA public key (for trusted contacts)
const encryptWithPublicKey = (content, publicKey) => {
  return crypto.publicEncrypt(publicKey, Buffer.from(content, 'utf8')).toString('base64');
};

// Decrypt with RSA private key
const decryptWithPrivateKey = (encryptedContent, privateKey) => {
  return crypto.privateDecrypt(privateKey, Buffer.from(encryptedContent, 'base64')).toString('utf8');
};

// Hash password with salt
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash: `${salt}:${hash}`, salt };
};

// Verify password
const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

module.exports = {
  generateKey,
  encryptContent,
  decryptContent,
  generateKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  hashPassword,
  verifyPassword
};