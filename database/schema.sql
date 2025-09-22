-- EternaNote Database Schema
-- SQLite Database for time-locked messaging and social features

-- Users table with encryption keys
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    master_key TEXT NOT NULL,
    profile_image TEXT,
    bio TEXT,
    birth_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    legacy_mode BOOLEAN DEFAULT 0
);

-- Time-locked messages/capsules
CREATE TABLE messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- 'self', 'user', 'trusted', 'public', 'family'
    recipient_id INTEGER,
    message_type VARCHAR(20) NOT NULL, -- 'text', 'audio', 'video', 'hybrid'
    title VARCHAR(200),
    content_encrypted BLOB NOT NULL,
    unlock_condition VARCHAR(50) NOT NULL, -- 'date', 'inactivity', 'key', 'event'
    unlock_value TEXT, -- date string, days, or condition details
    emotional_tag VARCHAR(30), -- 'happy', 'regret', 'proud', 'love', 'hope', 'wisdom'
    priority_level INTEGER DEFAULT 1, -- 1-5 priority for collision walls
    is_nested BOOLEAN DEFAULT 0,
    parent_message_id INTEGER,
    sequence_order INTEGER DEFAULT 1,
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'ripple', 'public'
    ripple_expansion_date DATETIME,
    self_destruct_hours INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unlock_at DATETIME,
    unlocked_at DATETIME,
    is_unlocked BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_message_id) REFERENCES messages(message_id)
);

-- Trusted contacts for legacy/afterlife features
CREATE TABLE trusted_contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_user_id INTEGER,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    secondary_key TEXT NOT NULL,
    access_rights TEXT, -- JSON: what they can access
    relationship VARCHAR(50), -- 'family', 'friend', 'executor', 'spouse'
    emergency_contact BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (contact_user_id) REFERENCES users(user_id)
);

-- Social interactions and responses
CREATE TABLE social_interactions (
    interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    interaction_type VARCHAR(30) NOT NULL, -- 'reflection_reply', 'ripple', 'collision', 'echo', 'time_thread'
    content_encrypted BLOB,
    scheduled_for DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(message_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Unlock logs for tracking access
CREATE TABLE unlock_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    unlocked_by INTEGER, -- user_id or contact_id
    unlock_method VARCHAR(30), -- 'scheduled', 'manual', 'trusted_key', 'inactivity'
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (message_id) REFERENCES messages(message_id),
    FOREIGN KEY (unlocked_by) REFERENCES users(user_id)
);

-- Memory collisions - messages unlocking on same day
CREATE TABLE memory_collisions (
    collision_id INTEGER PRIMARY KEY AUTOINCREMENT,
    collision_date DATE NOT NULL,
    user_id INTEGER NOT NULL,
    message_ids TEXT NOT NULL, -- JSON array of message IDs
    collision_theme VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Legacy badges and achievements
CREATE TABLE user_badges (
    badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_type VARCHAR(50) NOT NULL, -- 'longevity', 'creative', 'generational', 'wisdom_keeper'
    badge_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Parallel timelines for speculative futures
CREATE TABLE parallel_timelines (
    timeline_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    timeline_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Timeline messages for alternate futures
CREATE TABLE timeline_messages (
    timeline_message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timeline_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    speculative_date DATETIME,
    condition_met BOOLEAN DEFAULT 0,
    FOREIGN KEY (timeline_id) REFERENCES parallel_timelines(timeline_id),
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
);

-- Emotional analytics for users
CREATE TABLE emotional_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    dominant_emotion VARCHAR(30),
    emotion_scores TEXT, -- JSON: {happy: 0.3, regret: 0.1, ...}
    message_count INTEGER DEFAULT 0,
    reflection_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Generational threads for family conversations
CREATE TABLE generational_threads (
    thread_id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_name VARCHAR(100) NOT NULL,
    family_name VARCHAR(100),
    creator_id INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);

-- Thread participants
CREATE TABLE thread_participants (
    participant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(30) DEFAULT 'member', -- 'creator', 'admin', 'member'
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES generational_threads(thread_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX idx_messages_unlock_at ON messages(unlock_at);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_unlock_logs_message ON unlock_logs(message_id);
CREATE INDEX idx_collisions_date ON memory_collisions(collision_date);
CREATE INDEX idx_emotional_analytics_user_date ON emotional_analytics(user_id, date);