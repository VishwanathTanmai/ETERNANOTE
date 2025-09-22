# EternaNote 🕰️

**Tagline:** "Messages across time, for yourself and the world."

EternaNote is a revolutionary time-centric social platform where users create encrypted messages, posts, or media for the future — for themselves, loved ones, or the community. Messages unlock on specific dates, life events, or conditions, creating interactions across decades.

## 🌟 Core Features

### Time-Locked Messaging
- Send messages to your future self, friends, or family
- Unlock conditions: date, account inactivity, or secondary trusted keys
- Supports text, voice, video, or hybrid "capsules"

### Afterlife & Legacy Mode
- Messages delivered posthumously using trusted secondary keys
- Digital will capsules for loved ones
- Local encryption ensures total privacy

### Social Media with a Twist
- **Time-locked posts**: Social feed shows posts unlocking in the future
- **Generational threads**: Multi-decade conversations between families
- **Echo mode**: Feed prioritizes messages unlocking today
- **Ripple sharing**: Private messages expand over time to wider audience
- **Reflection replies**: Replies appear years later, creating cross-decade conversations

### Emotional & Legacy Features
- **Emotional tagging**: Tag capsules with feelings (happy, regret, proud, love)
- **Memory collisions**: Messages scheduled for same day create "collision walls"
- **Legacy badges**: Earn badges for longevity, creativity, generational impact
- **Emotional analytics**: Track emotional journey over time

### Advanced Capsule Management
- **Nested capsules**: Messages unlock sequentially like treasure hunts
- **Invisible influence posts**: Hidden posts unlock when conditions occur
- **Self-destructing posts**: Messages disappear after unlock window
- **Parallel timelines**: Maintain alternate-life timelines

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd eternanote
   ```

2. **Run Setup Script**
   ```bash
   # Windows
   setup.bat
   
   # Or manually:
   npm install
   cd frontend && npm install
   ```

3. **Start the Application**
   ```bash
   # Windows
   start.bat
   
   # Or manually:
   npm run dev
   ```

4. **Access EternaNote**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏗️ Architecture

### Backend (Node.js + SQLite)
- **Express.js** server with Socket.IO for real-time features
- **SQLite** database for local-first privacy
- **AES-256** encryption for message content
- **RSA** encryption for trusted contact features
- **Cron jobs** for scheduled message unlocking

### Frontend (React)
- **React 18** with modern hooks
- **Socket.IO** client for real-time notifications
- **Framer Motion** for smooth animations
- **Tailwind CSS** for responsive design
- **React Router** for navigation

### Key Services
- **Scheduler Service**: Handles time-locked message unlocking
- **Collision Service**: Detects memory collisions and serendipitous connections
- **Encryption Service**: Manages all cryptographic operations
- **Socket Service**: Real-time notifications and updates

## 🔐 Security & Privacy

- **Local-First**: All data stored locally in SQLite
- **End-to-End Encryption**: Messages encrypted with user's master key
- **Trusted Contacts**: RSA key pairs for legacy/afterlife features
- **No External APIs**: Complete privacy and offline capability
- **Secure Authentication**: JWT tokens with bcrypt password hashing

## 📱 Unique Features

### Memory Collisions 💫
When multiple messages unlock on the same day, they create a "collision wall" - a serendipitous collection of memories and emotions from different time periods.

### Generational Threads 👨‍👩‍👧‍👦
Family conversations that span decades, allowing grandparents to leave messages for grandchildren not yet born.

### Echo Mode 📻
A special feed that prioritizes messages unlocking today over recent activity, creating a unique "temporal social media" experience.

### Parallel Timelines 🔮
Users can create alternate timeline branches to explore "what if" scenarios and speculative futures.

### Emotional Analytics 📊
Track your emotional journey over time with detailed analytics of your message emotions and patterns.

## 🎯 Use Cases

- **Personal Time Capsules**: Messages to your future self
- **Family Legacy**: Multi-generational family conversations
- **Relationship Milestones**: Anniversary messages that unlock yearly
- **Goal Tracking**: Motivational messages for future achievements
- **Grief Support**: Posthumous messages from loved ones
- **Creative Projects**: Artistic works that reveal over time
- **Educational**: Historical perspectives that unlock on anniversaries

## 🛠️ Development

### Project Structure
```
eternanote/
├── backend/
│   ├── database/          # Database schema and connection
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Authentication & validation
│   └── utils/           # Encryption & utilities
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Main application pages
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API communication
└── database/            # SQLite database files
```

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run server` - Start development server with nodemon

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production

**Full Stack:**
- `npm run dev` - Start both frontend and backend in development mode

## 🌍 Philosophy

EternaNote reimagines social media around patience, reflection, and emotional legacy rather than instant gratification. It's designed for:

- **Patience over Instant Gratification**
- **Depth over Surface-Level Interactions**
- **Legacy over Ephemeral Content**
- **Emotional Growth over Engagement Metrics**
- **Privacy over Data Harvesting**
- **Time over Trends**

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

EternaNote is open to contributions! Whether it's new features, bug fixes, or documentation improvements, we welcome your input.

---

*"In a world of instant messages, EternaNote brings back the art of patience and the beauty of time."*