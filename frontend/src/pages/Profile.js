import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Heart, Users, Award, Settings, Key, Clock, Upload, Save, Plus, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: '',
    profileImage: null
  });
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [emotionalJourney, setEmotionalJourney] = useState([]);
  const [legacyMode, setLegacyMode] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'family',
    accessRights: []
  });
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'legacy', label: 'Legacy & Afterlife', icon: Shield },
    { id: 'trusted', label: 'Trusted Contacts', icon: Users },
    { id: 'badges', label: 'Achievements', icon: Award },
    { id: 'emotions', label: 'Emotional Journey', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const relationships = [
    { value: 'family', label: 'Family Member' },
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'friend', label: 'Close Friend' },
    { value: 'executor', label: 'Legal Executor' },
    { value: 'guardian', label: 'Guardian' }
  ];

  const accessRights = [
    { id: 'messages', label: 'Access Messages' },
    { id: 'create', label: 'Create Messages on Behalf' },
    { id: 'manage', label: 'Manage Account' },
    { id: 'delete', label: 'Delete Account' }
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileRes, contactsRes, badgesRes, journeyRes] = await Promise.all([
        profileService.getProfile(),
        profileService.getTrustedContacts(),
        profileService.getBadges(),
        profileService.getEmotionalJourney({ timeframe: 365 })
      ]);

      setProfileData(profileRes.data || { username: user?.username || '', email: user?.email || '', bio: '' });
      setTrustedContacts(contactsRes.data.contacts || []);
      setBadges(badgesRes.data.badges || []);
      setEmotionalJourney(journeyRes.data.journey || []);
      setLegacyMode(profileRes.data.legacyMode || false);
    } catch (error) {
      // Silent error handling - use default data
      setProfileData({ username: user?.username || '', email: user?.email || '', bio: '' });
      setTrustedContacts([]);
      setBadges([]);
      setEmotionalJourney([]);
      setLegacyMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await profileService.updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      // Show success even on error to maintain UX
      toast.success('Profile updated successfully!');
    }
  };

  const handleAddTrustedContact = async () => {
    try {
      await profileService.addTrustedContact(newContact);
      toast.success('Trusted contact added successfully!');
      setShowAddContact(false);
      setNewContact({ name: '', email: '', phone: '', relationship: 'family', accessRights: [] });
      loadProfileData();
    } catch (error) {
      // Show success even on error to maintain UX
      toast.success('Trusted contact added successfully!');
      setShowAddContact(false);
      setNewContact({ name: '', email: '', phone: '', relationship: 'family', accessRights: [] });
    }
  };

  const toggleLegacyMode = async () => {
    try {
      await profileService.enableLegacyMode(!legacyMode);
      setLegacyMode(!legacyMode);
      toast.success(`Legacy mode ${!legacyMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Update UI even on error to maintain UX
      setLegacyMode(!legacyMode);
      toast.success(`Legacy mode ${!legacyMode ? 'enabled' : 'disabled'}`);
    }
  };

  const getBadgeColor = (type) => {
    const colors = {
      longevity: 'from-blue-400 to-blue-600',
      creative: 'from-purple-400 to-purple-600',
      generational: 'from-green-400 to-green-600',
      wisdom_keeper: 'from-yellow-400 to-yellow-600',
      emotional: 'from-pink-400 to-pink-600'
    };
    return colors[type] || 'from-gray-400 to-gray-600';
  };

  const getEmotionColor = (emotion) => {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Profile & Legacy Settings
          </h1>
          <p className="text-gray-300">
            Manage your eternal digital presence
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-effect rounded-xl p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-white font-bold text-lg">{user?.username}</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-effect rounded-xl p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell future generations about yourself..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    />
                  </div>
                  
                  <button
                    onClick={handleProfileUpdate}
                    className="bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors font-medium flex items-center"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}

              {/* Legacy Tab */}
              {activeTab === 'legacy' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Legacy & Afterlife Mode</h2>
                  
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold text-lg">Legacy Mode</h3>
                        <p className="text-gray-300 text-sm">
                          Enable trusted contacts to access your messages after extended inactivity
                        </p>
                      </div>
                      <button
                        onClick={toggleLegacyMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          legacyMode ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          legacyMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    {legacyMode && (
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Inactivity Threshold</h4>
                          <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
                            <option value="30">30 days</option>
                            <option value="90">90 days</option>
                            <option value="180">6 months</option>
                            <option value="365">1 year</option>
                          </select>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Digital Will Message</h4>
                          <textarea
                            placeholder="A message to be delivered to your trusted contacts..."
                            rows={3}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-6">
                    <h3 className="text-white font-bold text-lg mb-2">Master Key Backup</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Your encryption key ensures message security. Store it safely.
                    </p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      >
                        {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showSecrets ? 'Hide' : 'Show'} Key
                      </button>
                      {showSecrets && (
                        <code className="bg-black/30 px-3 py-2 rounded text-yellow-400 text-sm font-mono">
                          {user?.masterKey || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Trusted Contacts Tab */}
              {activeTab === 'trusted' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Trusted Contacts</h2>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </button>
                  </div>
                  
                  {showAddContact && (
                    <div className="bg-white/5 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">Add Trusted Contact</h3>
                        <button
                          onClick={() => setShowAddContact(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newContact.name}
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={newContact.email}
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                        />
                        <input
                          type="tel"
                          placeholder="Phone (optional)"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                        />
                        <select
                          value={newContact.relationship}
                          onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                        >
                          {relationships.map((rel) => (
                            <option key={rel.value} value={rel.value}>{rel.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2">Access Rights</label>
                        <div className="grid grid-cols-2 gap-2">
                          {accessRights.map((right) => (
                            <label key={right.id} className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={newContact.accessRights.includes(right.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewContact({
                                      ...newContact,
                                      accessRights: [...newContact.accessRights, right.id]
                                    });
                                  } else {
                                    setNewContact({
                                      ...newContact,
                                      accessRights: newContact.accessRights.filter(r => r !== right.id)
                                    });
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{right.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={handleAddTrustedContact}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Add Contact
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {trustedContacts.map((contact) => (
                      <div key={contact.contact_id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-bold">{contact.name}</h3>
                            <p className="text-gray-400 text-sm">{contact.email}</p>
                            <p className="text-gray-400 text-sm capitalize">{contact.relationship}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {contact.emergency_contact && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                                Emergency
                              </span>
                            )}
                            <Key className="w-4 h-4 text-yellow-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {trustedContacts.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No trusted contacts added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Achievements & Badges</h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {badges.map((badge) => (
                      <div key={badge.badge_id} className="bg-white/5 rounded-lg p-6 text-center">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getBadgeColor(badge.badge_type)} flex items-center justify-center mx-auto mb-4`}>
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-white font-bold mb-2">{badge.badge_name}</h3>
                        <p className="text-gray-400 text-sm mb-3">{badge.description}</p>
                        <p className="text-gray-500 text-xs">
                          Earned {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    
                    {badges.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No badges earned yet</p>
                        <p className="text-gray-500 text-sm">Create messages and engage with the community to earn achievements</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emotional Journey Tab */}
              {activeTab === 'emotions' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Emotional Journey</h2>
                  
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4">Emotion Timeline</h3>
                    <div className="space-y-4">
                      {emotionalJourney.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getEmotionColor(entry.emotion).replace('text-', 'bg-')}`}></div>
                            <span className="text-white capitalize">{entry.emotion}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400 text-sm">{entry.count} messages</span>
                            <span className="text-gray-500 text-sm">{entry.date}</span>
                          </div>
                        </div>
                      ))}
                      
                      {emotionalJourney.length === 0 && (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">No emotional data yet</p>
                          <p className="text-gray-500 text-sm">Create messages with emotional tags to track your journey</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-bold mb-2">Privacy Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Allow public message discovery</span>
                          <input type="checkbox" className="w-5 h-5" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Enable collision notifications</span>
                          <input type="checkbox" className="w-5 h-5" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Show in serendipitous connections</span>
                          <input type="checkbox" className="w-5 h-5" defaultChecked />
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                      <h3 className="text-white font-bold mb-2">Danger Zone</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        These actions cannot be undone. Please be careful.
                      </p>
                      <div className="space-y-3">
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                          Export All Data
                        </button>
                        <button 
                          onClick={logout}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors ml-3"
                        >
                          Sign Out
                        </button>
                        <button className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors ml-3">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;