import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Calendar, Sparkles, Heart, Users, TrendingUp, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageService, socialService } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalMessages: 0,
    lockedMessages: 0,
    unlockedToday: 0,
    upcomingUnlocks: 0
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [upcomingUnlocks, setUpcomingUnlocks] = useState([]);
  const [todayUnlocks, setTodayUnlocks] = useState([]);
  const [emotionalInsights, setEmotionalInsights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (socket) {
      socket.on('message_unlocked', handleMessageUnlocked);
      socket.on('memory_collision', handleMemoryCollision);
      socket.emit('check_unlocks');
      
      return () => {
        socket.off('message_unlocked');
        socket.off('memory_collision');
      };
    }
  }, [socket]);

  const loadDashboardData = async () => {
    try {
      const [messagesRes, echoRes, insightsRes] = await Promise.all([
        messageService.getMyMessages(),
        messageService.getEchoFeed(),
        socialService.getEmotionalAnalytics({ timeframe: 30 })
      ]);

      const messages = messagesRes.data.messages || [];
      const locked = messages.filter(m => !m.is_unlocked);
      const today = new Date().toISOString().split('T')[0];
      const todayUnlocked = messages.filter(m => 
        m.unlocked_at && m.unlocked_at.startsWith(today)
      );
      
      const upcoming = locked
        .filter(m => m.unlock_at)
        .sort((a, b) => new Date(a.unlock_at) - new Date(b.unlock_at))
        .slice(0, 5);

      setStats({
        totalMessages: messages.length,
        lockedMessages: locked.length,
        unlockedToday: todayUnlocked.length,
        upcomingUnlocks: upcoming.length
      });

      setRecentMessages(messages.slice(0, 5));
      setUpcomingUnlocks(upcoming);
      setTodayUnlocks((echoRes.data.messages || []).slice(0, 3));
      setEmotionalInsights(insightsRes.data || { recentEmotions: [] });
    } catch (error) {
      // Silent error handling - show default data
      setStats({ totalMessages: 0, lockedMessages: 0, unlockedToday: 0, upcomingUnlocks: 0 });
      setRecentMessages([]);
      setUpcomingUnlocks([]);
      setTodayUnlocks([]);
      setEmotionalInsights({ recentEmotions: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUnlocked = (data) => {
    toast.success(`🔓 Message "${data.title}" has been unlocked!`);
    loadDashboardData();
  };

  const handleMemoryCollision = (data) => {
    toast.success(`💫 Memory collision detected! ${data.messageCount} messages unlocked together`);
  };

  const getTimeUntilUnlock = (unlockAt) => {
    const now = new Date();
    const unlock = new Date(unlockAt);
    const diff = unlock - now;
    
    if (diff <= 0) return 'Ready to unlock';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getEmotionalColor = (emotion) => {
    const colors = {
      happy: 'text-yellow-400',
      love: 'text-pink-400',
      proud: 'text-purple-400',
      hope: 'text-blue-400',
      wisdom: 'text-green-400',
      regret: 'text-gray-400'
    };
    return colors[emotion] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.username} 🕰️
          </h1>
          <p className="text-gray-300">
            Your journey through time continues...
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: MessageSquare, label: 'Total Messages', value: stats.totalMessages, color: 'blue' },
            { icon: Lock, label: 'Time-Locked', value: stats.lockedMessages, color: 'purple' },
            { icon: Unlock, label: 'Unlocked Today', value: stats.unlockedToday, color: 'green' },
            { icon: Clock, label: 'Upcoming Unlocks', value: stats.upcomingUnlocks, color: 'yellow' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Unlocks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-400" />
              Upcoming Unlocks
            </h2>
            <div className="space-y-4">
              {upcomingUnlocks.map((message) => (
                <div key={message.message_id} className="border-l-4 border-yellow-400 pl-4">
                  <h3 className="text-white font-medium">{message.title}</h3>
                  <p className="text-gray-400 text-sm">
                    Unlocks in {getTimeUntilUnlock(message.unlock_at)}
                  </p>
                  {message.emotional_tag && (
                    <span className={`text-xs ${getEmotionalColor(message.emotional_tag)}`}>
                      #{message.emotional_tag}
                    </span>
                  )}
                </div>
              ))}
              {upcomingUnlocks.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  No upcoming unlocks
                </p>
              )}
            </div>
          </motion.div>

          {/* Today's Unlocks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-green-400" />
              Today's Unlocks
            </h2>
            <div className="space-y-4">
              {todayUnlocks.map((message) => (
                <div key={message.id} className="border-l-4 border-green-400 pl-4">
                  <h3 className="text-white font-medium">{message.title}</h3>
                  <p className="text-gray-400 text-sm">
                    Unlocked at {new Date(message.unlockedAt).toLocaleTimeString()}
                  </p>
                  {message.emotionalTag && (
                    <span className={`text-xs ${getEmotionalColor(message.emotionalTag)}`}>
                      #{message.emotionalTag}
                    </span>
                  )}
                </div>
              ))}
              {todayUnlocks.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  No messages unlocked today
                </p>
              )}
            </div>
          </motion.div>

          {/* Emotional Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-400" />
              Emotional Journey
            </h2>
            <div className="space-y-3">
              {emotionalInsights.recentEmotions?.map((emotion, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`capitalize ${getEmotionalColor(emotion.type)}`}>
                    {emotion.type}
                  </span>
                  <div className="flex-1 mx-3 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r from-${emotion.type === 'happy' ? 'yellow' : emotion.type === 'love' ? 'pink' : 'blue'}-400 to-${emotion.type === 'happy' ? 'yellow' : emotion.type === 'love' ? 'pink' : 'blue'}-600`}
                      style={{ width: `${emotion.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-400 text-sm">{emotion.count}</span>
                </div>
              )) || (
                <p className="text-gray-400 text-center py-4">
                  Start creating messages to see insights
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <a href="/create" className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all group">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bold mb-2">Create Message</h3>
            <p className="text-gray-400 text-sm">Send a message to your future self</p>
          </a>
          
          <a href="/echo" className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all group">
            <Calendar className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bold mb-2">Echo Feed</h3>
            <p className="text-gray-400 text-sm">See what's unlocking today</p>
          </a>
          
          <a href="/timeline" className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all group">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bold mb-2">Timeline</h3>
            <p className="text-gray-400 text-sm">View your journey through time</p>
          </a>
        </motion.div>


      </div>
    </div>
  );
};

export default Dashboard;