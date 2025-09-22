import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Heart, Clock, Users, Zap, ArrowRight, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { socialService, messageService } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const CollisionWall = () => {
  const { date } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [collisionData, setCollisionData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [collisionHistory, setCollisionHistory] = useState([]);
  const [serendipitousConnections, setSerendipitousConnections] = useState([]);
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [animatingMessages, setAnimatingMessages] = useState([]);

  const emotionColors = {
    happy: 'from-yellow-400 to-orange-500',
    love: 'from-pink-400 to-red-500',
    proud: 'from-purple-400 to-indigo-500',
    hope: 'from-blue-400 to-cyan-500',
    wisdom: 'from-green-400 to-emerald-500',
    regret: 'from-gray-400 to-slate-500',
    mixed: 'from-indigo-400 via-purple-500 to-pink-500'
  };

  useEffect(() => {
    loadCollisionData();
    loadCollisionHistory();
    
    if (socket) {
      socket.on('memory_collision', handleNewCollision);
      socket.on('message_unlocked', handleMessageUnlocked);
      socket.emit('join_collision_room', selectedDate);
      
      return () => {
        socket.off('memory_collision');
        socket.off('message_unlocked');
      };
    }
  }, [selectedDate, socket]);

  const loadCollisionData = async () => {
    try {
      setLoading(true);
      const [collisionRes, connectionsRes] = await Promise.all([
        socialService.getCollisionWall(selectedDate),
        socialService.getSerendipitousConnections(selectedDate)
      ]);
      
      setCollisionData(collisionRes.data || null);
      setSerendipitousConnections(connectionsRes.data?.connections || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load collision data');
      }
      setCollisionData(null);
      setSerendipitousConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCollisionHistory = async () => {
    try {
      const response = await socialService.getCollisionHistory({ limit: 10 });
      setCollisionHistory(response.data.collisions || []);
    } catch (error) {
      console.error('Failed to load collision history');
    }
  };

  const handleNewCollision = (data) => {
    if (data.date === selectedDate) {
      toast.success(`💫 New collision detected! ${data.messageCount} messages converged`);
      loadCollisionData();
      
      // Animate new messages
      setAnimatingMessages(data.messageIds);
      setTimeout(() => setAnimatingMessages([]), 2000);
    }
  };

  const handleMessageUnlocked = (data) => {
    const unlockDate = new Date(data.unlockedAt).toISOString().split('T')[0];
    if (unlockDate === selectedDate) {
      loadCollisionData();
    }
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: '😊',
      love: '❤️',
      proud: '🏆',
      hope: '🌟',
      wisdom: '🧠',
      regret: '😔',
      mixed: '🌈'
    };
    return icons[emotion] || '💫';
  };

  const filteredMessages = collisionData?.messages?.filter(msg => 
    filterEmotion === 'all' || msg.emotional_tag === filterEmotion
  ) || [];

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <Sparkles className="w-10 h-10 mr-3 text-yellow-400" />
            Collision Wall
          </h1>
          <p className="text-gray-300 text-lg">
            When messages converge in time, magic happens
          </p>
        </motion.div>

        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Calendar className="w-6 h-6 text-yellow-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Emotions</option>
                <option value="happy">Happy</option>
                <option value="love">Love</option>
                <option value="proud">Proud</option>
                <option value="hope">Hope</option>
                <option value="wisdom">Wisdom</option>
                <option value="regret">Regret</option>
              </select>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
          </div>
        ) : collisionData ? (
          <div className="space-y-8">
            {/* Collision Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`glass-effect rounded-2xl p-8 bg-gradient-to-r ${emotionColors[collisionData?.collision?.collision_theme?.toLowerCase().split(' ')[0]] || emotionColors.mixed} bg-opacity-20`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {getEmotionIcon(collisionData?.collision?.collision_theme?.toLowerCase().split(' ')[0] || 'mixed')}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {collisionData?.collision?.collision_theme || 'Memory Collision'}
                </h2>
                <p className="text-gray-300 text-lg">
                  {filteredMessages.length} messages converged on {new Date(selectedDate).toLocaleDateString()}
                </p>
                <div className="flex justify-center items-center mt-4 space-x-6">
                  <div className="flex items-center text-yellow-400">
                    <Zap className="w-5 h-5 mr-2" />
                    <span>Collision Energy: High</span>
                  </div>
                  <div className="flex items-center text-blue-400">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Time Span: {getTimeAgo(collisionData?.collision?.created_at || new Date())}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Messages Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredMessages.map((message, index) => (
                  <motion.div
                    key={message.message_id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: animatingMessages.includes(message.message_id) ? [1, 1.1, 1] : 1
                    }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ 
                      delay: index * 0.1,
                      scale: { duration: 0.5, repeat: animatingMessages.includes(message.message_id) ? 2 : 0 }
                    }}
                    className={`glass-effect rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group ${
                      animatingMessages.includes(message.message_id) ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">
                        {message.title}
                      </h3>
                      {message.emotional_tag && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                          emotionColors[message.emotional_tag] || emotionColors.mixed
                        } text-white`}>
                          {getEmotionIcon(message.emotional_tag)} {message.emotional_tag}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {message.content_preview || 'Encrypted content - unlock to view'}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Created: {getTimeAgo(message.created_at)}</span>
                      <span>Unlocked: {new Date(message.unlocked_at).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-yellow-400">
                        <Heart className="w-4 h-4 mr-1" />
                        <span className="text-sm">{message.view_count || 0} views</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Serendipitous Connections */}
            {serendipitousConnections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-effect rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-purple-400" />
                  Serendipitous Connections
                </h3>
                <p className="text-gray-300 mb-4">
                  Other users who unlocked messages with similar emotions today
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {serendipitousConnections.map((connection, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-400 font-medium">
                          #{connection.emotionalTag}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {connection.connectedUsers.length} users
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Emotional resonance detected across {connection.messages.length} messages
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🌌</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Collisions on This Date
            </h2>
            <p className="text-gray-300 mb-8">
              No messages unlocked together on {new Date(selectedDate).toLocaleDateString()}.
              <br />Try selecting a different date or create more time-locked messages!
            </p>
            <a
              href="/create"
              className="inline-flex items-center px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Time Capsule
            </a>
          </motion.div>
        )}

        {/* Collision History */}
        {collisionHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-xl p-6 mt-8"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-400" />
              Recent Collision History
            </h3>
            <div className="space-y-3">
              {collisionHistory.slice(0, 5).map((collision) => (
                <div key={collision.collision_id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getEmotionIcon(collision?.collision_theme?.toLowerCase().split(' ')[0] || 'mixed')}
                    </div>
                    <div>
                      <p className="text-white font-medium">{collision?.collision_theme || 'Memory Collision'}</p>
                      <p className="text-gray-400 text-sm">
                        {JSON.parse(collision?.message_ids || '[]').length} messages on {new Date(collision?.collision_date || new Date()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDate(collision?.collision_date || new Date().toISOString().split('T')[0])}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CollisionWall;