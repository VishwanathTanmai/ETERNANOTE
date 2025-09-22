import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, Heart, MessageCircle, Share2, Zap, Filter, RefreshCw, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageService, socialService } from '../services/api';
import toast from 'react-hot-toast';

const EchoFeed = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [echoMessages, setEchoMessages] = useState([]);
  const [liveUnlocks, setLiveUnlocks] = useState([]);
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [collisions, setCollisions] = useState([]);
  const [serendipitousConnections, setSerendipitousConnections] = useState([]);

  const emotions = [
    { value: 'all', label: 'All Echoes', icon: '🌊' },
    { value: 'happy', label: 'Joy', icon: '😊' },
    { value: 'love', label: 'Love', icon: '❤️' },
    { value: 'proud', label: 'Pride', icon: '🏆' },
    { value: 'hope', label: 'Hope', icon: '🌟' },
    { value: 'wisdom', label: 'Wisdom', icon: '🧠' },
    { value: 'regret', label: 'Reflection', icon: '😔' }
  ];

  useEffect(() => {
    loadEchoFeed();
    
    if (socket) {
      socket.on('message_unlocked', handleLiveUnlock);
      socket.on('memory_collision', handleCollision);
      socket.on('serendipitous_connection', handleConnection);
      
      return () => {
        socket.off('message_unlocked');
        socket.off('memory_collision');
        socket.off('serendipitous_connection');
      };
    }
  }, [socket]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadEchoFeed();
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadEchoFeed = async () => {
    try {
      const [echoRes, collisionsRes, connectionsRes] = await Promise.all([
        messageService.getEchoFeed(),
        socialService.getTodayCollisions(),
        socialService.getSerendipitousConnections(new Date().toISOString().split('T')[0])
      ]);
      
      setEchoMessages(echoRes.data.messages || []);
      setCollisions(collisionsRes.data.collisions || []);
      setSerendipitousConnections(connectionsRes.data.connections || []);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Failed to load echo feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveUnlock = (data) => {
    const unlockDate = new Date(data.unlockedAt).toDateString();
    const today = new Date().toDateString();
    
    if (unlockDate === today) {
      setLiveUnlocks(prev => [{
        ...data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
      
      toast.success(
        <div className="flex items-center">
          <Radio className="w-4 h-4 mr-2 text-green-400" />
          <span>Live unlock: "{data.title}"</span>
        </div>,
        { duration: 5000 }
      );
      
      // Add to echo feed if it matches current filter
      if (filterEmotion === 'all' || data.emotionalTag === filterEmotion) {
        setEchoMessages(prev => [data, ...prev]);
      }
    }
  };

  const handleCollision = (data) => {
    toast.success(
      <div className="flex items-center">
        <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
        <span>Memory collision detected! {data.messageCount} messages converged</span>
      </div>,
      { duration: 6000 }
    );
    setCollisions(prev => [data, ...prev]);
  };

  const handleConnection = (data) => {
    toast.success(
      <div className="flex items-center">
        <Users className="w-4 h-4 mr-2 text-blue-400" />
        <span>Serendipitous connection: {data.emotionalTag} resonance</span>
      </div>,
      { duration: 4000 }
    );
    setSerendipitousConnections(prev => [data, ...prev]);
  };

  const filteredMessages = echoMessages.filter(msg => 
    filterEmotion === 'all' || msg.emotionalTag === filterEmotion
  );

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return time.toLocaleDateString();
  };

  const getEmotionGradient = (emotion) => {
    const gradients = {
      happy: 'from-yellow-400 to-orange-500',
      love: 'from-pink-400 to-red-500',
      proud: 'from-purple-400 to-indigo-500',
      hope: 'from-blue-400 to-cyan-500',
      wisdom: 'from-green-400 to-emerald-500',
      regret: 'from-gray-400 to-slate-500'
    };
    return gradients[emotion] || 'from-indigo-400 to-purple-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <Radio className="w-10 h-10 mr-3 text-green-400 animate-pulse" />
            Echo Feed
          </h1>
          <p className="text-gray-300 text-lg">
            Messages echoing across time - unlocking right now
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-400">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <span className="flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              {filteredMessages.length} echoes today
            </span>
          </div>
        </motion.div>

        {/* Live Activity Bar */}
        {liveUnlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-lg p-4 mb-6 border-l-4 border-green-400"
          >
            <h3 className="text-green-400 font-bold mb-3 flex items-center">
              <Radio className="w-5 h-5 mr-2 animate-pulse" />
              Live Unlocks
            </h3>
            <div className="space-y-2">
              {liveUnlocks.map((unlock, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">"{unlock.title}"</span>
                  <span className="text-gray-400">{getTimeAgo(unlock.timestamp)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Emotion Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                {emotions.map(emotion => (
                  <option key={emotion.value} value={emotion.value}>
                    {emotion.icon} {emotion.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Auto Refresh Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-300 text-sm">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRefresh ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            {/* Manual Refresh */}
            <button
              onClick={loadEchoFeed}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Collisions & Connections */}
        {(collisions.length > 0 || serendipitousConnections.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {collisions.length > 0 && (
              <div className="glass-effect rounded-lg p-4 border-l-4 border-purple-400">
                <h3 className="text-purple-400 font-bold mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Memory Collisions
                </h3>
                <div className="space-y-2">
                  {collisions.slice(0, 3).map((collision, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-white">{collision.theme}</span>
                      <span className="text-gray-400 ml-2">({collision.messageCount} messages)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {serendipitousConnections.length > 0 && (
              <div className="glass-effect rounded-lg p-4 border-l-4 border-blue-400">
                <h3 className="text-blue-400 font-bold mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Serendipitous Connections
                </h3>
                <div className="space-y-2">
                  {serendipitousConnections.slice(0, 3).map((connection, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-white">#{connection.emotionalTag}</span>
                      <span className="text-gray-400 ml-2">({connection.userCount} users)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Echo Messages */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-effect rounded-xl p-6 border-l-4 border-gradient-to-b ${
                    message.emotionalTag 
                      ? `border-${message.emotionalTag === 'happy' ? 'yellow' : message.emotionalTag === 'love' ? 'pink' : 'blue'}-400`
                      : 'border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{message.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>by {message.senderUsername || 'Anonymous'}</span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Unlocked {getTimeAgo(message.unlockedAt)}
                        </span>
                      </div>
                    </div>
                    
                    {message.emotionalTag && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                        getEmotionGradient(message.emotionalTag)
                      } text-white`}>
                        {emotions.find(e => e.value === message.emotionalTag)?.icon} {message.emotionalTag}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {message.content?.text || 'Encrypted content'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-pink-400 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Echo</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Reflect</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">Ripple</span>
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Echo #{index + 1}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredMessages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Echoes Yet</h2>
                <p className="text-gray-400 mb-8">
                  {filterEmotion === 'all' 
                    ? 'No messages have unlocked today. The day is still young!'
                    : `No ${filterEmotion} messages unlocked today`
                  }
                </p>
                <a
                  href="/create"
                  className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Create Time Capsule
                </a>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EchoFeed;