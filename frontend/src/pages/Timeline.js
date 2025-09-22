import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Lock, Unlock, Filter, Search, TrendingUp, Zap, Heart, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageService, timelineService } from '../services/api';
import toast from 'react-hot-toast';

const Timeline = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [activeTimeline, setActiveTimeline] = useState('main');
  const [viewMode, setViewMode] = useState('chronological');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [realTimeUnlocks, setRealTimeUnlocks] = useState([]);

  useEffect(() => {
    loadTimelineData();
    
    if (socket) {
      socket.on('message_unlocked', handleRealTimeUnlock);
      socket.on('messages_unlocked', handleBatchUnlock);
      
      return () => {
        socket.off('message_unlocked');
        socket.off('messages_unlocked');
      };
    }
  }, [socket, activeTimeline]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const [messagesRes, timelinesRes] = await Promise.all([
        messageService.getMyMessages({ timeline: activeTimeline }),
        timelineService.getTimelines()
      ]);
      
      setMessages(messagesRes.data.messages || []);
      setTimelines(timelinesRes.data.timelines || []);
    } catch (error) {
      toast.error('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUnlock = (data) => {
    setRealTimeUnlocks(prev => [data, ...prev.slice(0, 4)]);
    toast.success(`🔓 "${data.title}" unlocked!`);
    loadTimelineData();
  };

  const handleBatchUnlock = (data) => {
    toast.success(`🎉 ${data.length} messages unlocked simultaneously!`);
    loadTimelineData();
  };

  const getTimeUntilUnlock = (unlockAt) => {
    const now = new Date();
    const unlock = new Date(unlockAt);
    const diff = unlock - now;
    
    if (diff <= 0) return 'Ready to unlock';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years}y ${days % 365}d`;
    if (days > 0) return `${days}d`;
    return 'Soon';
  };

  const filteredMessages = messages
    .filter(msg => {
      if (filterStatus === 'locked') return !msg.is_unlocked;
      if (filterStatus === 'unlocked') return msg.is_unlocked;
      return true;
    })
    .filter(msg => 
      searchTerm === '' || 
      msg.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (viewMode === 'chronological') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return new Date(a.unlock_at || a.created_at) - new Date(b.unlock_at || b.created_at);
    });

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'border-yellow-400 bg-yellow-400/10',
      love: 'border-pink-400 bg-pink-400/10',
      proud: 'border-purple-400 bg-purple-400/10',
      hope: 'border-blue-400 bg-blue-400/10',
      wisdom: 'border-green-400 bg-green-400/10',
      regret: 'border-gray-400 bg-gray-400/10'
    };
    return colors[emotion] || 'border-gray-600 bg-gray-600/10';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 mr-3 text-blue-400" />
            Timeline Journey
          </h1>
          <p className="text-gray-300">Your messages across the fabric of time</p>
        </motion.div>

        {/* Real-time Unlock Notifications */}
        {realTimeUnlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="glass-effect rounded-lg p-4 border-l-4 border-green-400">
              <h3 className="text-green-400 font-bold mb-2">🎉 Recent Unlocks</h3>
              <div className="space-y-2">
                {realTimeUnlocks.map((unlock, index) => (
                  <div key={index} className="text-white text-sm">
                    "{unlock.title}" unlocked {new Date(unlock.unlockedAt).toLocaleTimeString()}
                  </div>
                ))}
              </div>
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
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Timeline</label>
              <select
                value={activeTimeline}
                onChange={(e) => setActiveTimeline(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="main">Main Timeline</option>
                {timelines.map(timeline => (
                  <option key={timeline.timeline_id} value={timeline.timeline_id}>
                    {timeline.timeline_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="chronological">Creation Order</option>
                <option value="unlock">Unlock Order</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="all">All Messages</option>
                <option value="locked">Time-Locked</option>
                <option value="unlocked">Unlocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-400 via-purple-500 to-pink-500"></div>
            
            {/* Messages */}
            <div className="space-y-8">
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.message_id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                    message.is_unlocked 
                      ? 'bg-green-400 border-green-400' 
                      : 'bg-yellow-400 border-yellow-400 animate-pulse'
                  }`}></div>
                  
                  {/* Message Card */}
                  <div className={`glass-effect rounded-xl p-6 border-l-4 ${
                    message.emotional_tag 
                      ? getEmotionColor(message.emotional_tag)
                      : 'border-gray-600 bg-gray-600/10'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">{message.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Created {new Date(message.created_at).toLocaleDateString()}
                          </span>
                          {message.unlock_at && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {message.is_unlocked 
                                ? `Unlocked ${new Date(message.unlocked_at).toLocaleDateString()}`
                                : `Unlocks ${getTimeUntilUnlock(message.unlock_at)}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {message.is_unlocked ? (
                          <Unlock className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-yellow-400" />
                        )}
                        {message.emotional_tag && (
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white">
                            #{message.emotional_tag}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {message.is_unlocked ? (
                      <div>
                        <p className="text-gray-300 mb-4">
                          {message.content_preview || 'Click to view full content'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {message.view_count || 0} views
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {message.message_type}
                            </span>
                          </div>
                          <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                            View Full Message →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
                        <p className="text-gray-400">
                          This message is time-locked
                        </p>
                        <p className="text-yellow-400 text-sm">
                          {getTimeUntilUnlock(message.unlock_at)} remaining
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {filteredMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Messages Found</h2>
                  <p className="text-gray-400 mb-8">
                    {searchTerm ? 'No messages match your search' : 'Start creating time capsules to build your timeline'}
                  </p>
                  <a
                    href="/create"
                    className="inline-flex items-center px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Create First Message
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;