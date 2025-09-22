import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Home, Plus, Sparkles, User, Calendar, Radio, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/collision', icon: Sparkles, label: 'Collisions' },
    { path: '/timeline', icon: Calendar, label: 'Timeline' },
    { path: '/echo', icon: Radio, label: 'Echo Feed' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="glass-effect border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Clock className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              Eterna<span className="text-yellow-400">Note</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path === '/collision' && location.pathname.startsWith('/collision'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-yellow-400/20 text-yellow-400' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="hidden md:block">{item.label}</span>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info & Status */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300 hidden sm:block">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-white font-medium">{user?.username}</div>
                <div className="text-gray-400 text-sm">Time Traveler</div>
              </div>
              
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-yellow-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}

              <button
                onClick={logout}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;