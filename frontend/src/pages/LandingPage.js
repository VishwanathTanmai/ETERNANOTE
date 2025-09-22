import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Heart, Lock, Users, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    birthDate: ''
  });
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = isLogin 
      ? await login({ username: formData.username, password: formData.password })
      : await register(formData);

    if (result.success) {
      toast.success(`Welcome to EternaNote! 🕰️`);
    } else {
      toast.error(result.error);
    }
  };

  const features = [
    {
      icon: Clock,
      title: "Time-Locked Messages",
      description: "Send messages to your future self or loved ones that unlock on specific dates or conditions"
    },
    {
      icon: Heart,
      title: "Emotional Legacy",
      description: "Tag messages with emotions and build a digital legacy that spans generations"
    },
    {
      icon: Sparkles,
      title: "Memory Collisions",
      description: "Discover serendipitous connections when multiple messages unlock on the same day"
    },
    {
      icon: Users,
      title: "Generational Threads",
      description: "Create family conversations that span decades and connect generations"
    },
    {
      icon: Lock,
      title: "Afterlife Mode",
      description: "Ensure your messages reach loved ones even after you're gone with trusted contacts"
    },
    {
      icon: Calendar,
      title: "Parallel Timelines",
      description: "Explore alternate life paths and speculative futures with timeline branching"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-6">
            Eterna<span className="text-yellow-400">Note</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Messages across time, for yourself and the world
          </p>
          <div className="flex justify-center space-x-4 text-lg text-gray-400">
            <span>🕰️ Time Capsules</span>
            <span>💫 Memory Collisions</span>
            <span>🔮 Future Messages</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              A Social Platform Built for Time
            </h2>
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="glass-effect rounded-lg p-6"
                >
                  <div className="flex items-start space-x-4">
                    <feature.icon className="w-8 h-8 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-effect rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Join EternaNote'}
              </h3>
              <p className="text-gray-300">
                {isLogin ? 'Access your time capsules' : 'Start your journey through time'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              )}

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <input
                    type="date"
                    placeholder="Birth Date (Optional)"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
              >
                {isLogin ? 'Enter EternaNote' : 'Begin Your Journey'}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;