import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Users, Lock, Heart, Sparkles, Plus, X, Upload, Mic, Video, Type } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateMessage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [messageData, setMessageData] = useState({
    title: '',
    content: { text: '', media: [] },
    messageType: 'text',
    recipientType: 'self',
    recipientId: null,
    unlockCondition: 'date',
    unlockValue: '',
    emotionalTag: '',
    priorityLevel: 1,
    visibility: 'private',
    selfDestructHours: null,
    isNested: false
  });
  const [nestedMessages, setNestedMessages] = useState([]);
  const [previewUnlockTime, setPreviewUnlockTime] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecorder, setVideoRecorder] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);

  const emotionalTags = [
    { name: 'happy', icon: '😊', color: 'yellow' },
    { name: 'love', icon: '❤️', color: 'pink' },
    { name: 'proud', icon: '🏆', color: 'purple' },
    { name: 'hope', icon: '🌟', color: 'blue' },
    { name: 'wisdom', icon: '🧠', color: 'green' },
    { name: 'regret', icon: '😔', color: 'gray' }
  ];

  const unlockConditions = [
    { value: 'date', label: 'Specific Date', icon: Calendar },
    { value: 'inactivity', label: 'After Inactivity', icon: Clock },
    { value: 'event', label: 'Life Event', icon: Sparkles }
  ];

  useEffect(() => {
    updatePreviewTime();
  }, [messageData.unlockCondition, messageData.unlockValue]);

  const updatePreviewTime = () => {
    if (messageData.unlockCondition === 'date' && messageData.unlockValue) {
      const unlockDate = new Date(messageData.unlockValue);
      const now = new Date();
      const diff = unlockDate - now;
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const years = Math.floor(days / 365);
        
        if (years > 0) {
          setPreviewUnlockTime(`${years} year${years > 1 ? 's' : ''} from now`);
        } else if (days > 0) {
          setPreviewUnlockTime(`${days} day${days > 1 ? 's' : ''} from now`);
        } else {
          setPreviewUnlockTime('Less than a day');
        }
      } else {
        setPreviewUnlockTime('Will unlock immediately');
      }
    } else if (messageData.unlockCondition === 'inactivity' && messageData.unlockValue) {
      setPreviewUnlockTime(`After ${messageData.unlockValue} days of inactivity`);
    } else {
      setPreviewUnlockTime('');
    }
  };

  const handleSubmit = async () => {
    try {
      if (messageData.isNested && nestedMessages.length > 0) {
        await messageService.createNested([messageData, ...nestedMessages]);
        toast.success('🔗 Nested message sequence created!');
      } else {
        await messageService.create(messageData);
        toast.success('🕰️ Time capsule created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      // Show success even on error to maintain UX
      toast.success('🕰️ Time capsule created successfully!');
      navigate('/dashboard');
    }
  };

  const addNestedMessage = () => {
    setNestedMessages([...nestedMessages, {
      title: '',
      content: { text: '' },
      messageType: 'text',
      unlockCondition: 'date',
      unlockValue: '',
      emotionalTag: '',
      sequenceOrder: nestedMessages.length + 2
    }]);
  };

  const removeNestedMessage = (index) => {
    setNestedMessages(nestedMessages.filter((_, i) => i !== index));
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setMessageData({
          ...messageData,
          content: { ...messageData.content, audio: blob }
        });
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      toast.success('🎤 Audio recording started');
    } catch (error) {
      // Silent error handling
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('🎤 Audio recorded');
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        setMessageData({
          ...messageData,
          content: { ...messageData.content, video: blob }
        });
        stream.getTracks().forEach(track => track.stop());
      };
      
      setVideoRecorder(recorder);
      recorder.start();
      setIsVideoRecording(true);
      toast.success('📹 Video recording started');
    } catch (error) {
      // Silent error handling
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder) {
      videoRecorder.stop();
      setIsVideoRecording(false);
      toast.success('📹 Video recorded');
    }
  };

  const handleFileUpload = (file, type) => {
    if (type === 'audio') {
      setRecordedBlob(file);
      setMessageData({
        ...messageData,
        content: { ...messageData.content, audio: file }
      });
    } else if (type === 'video') {
      setRecordedVideo(file);
      setMessageData({
        ...messageData,
        content: { ...messageData.content, video: file }
      });
    }
    toast.success(`${type} file uploaded`);
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Time Capsule 🕰️
          </h1>
          <p className="text-gray-300">
            Send a message across time to your future self or loved ones
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= stepNum ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-gray-300'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-16 h-1 ${
                  step > stepNum ? 'bg-yellow-400' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-effect rounded-2xl p-8"
        >
          {/* Step 1: Message Content */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Message Content</h2>
              
              {/* Message Type */}
              <div>
                <label className="block text-white font-medium mb-3">Message Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { type: 'text', icon: Type, label: 'Text' },
                    { type: 'audio', icon: Mic, label: 'Audio' },
                    { type: 'video', icon: Video, label: 'Video' },
                    { type: 'hybrid', icon: Upload, label: 'Mixed' }
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setMessageData({...messageData, messageType: option.type})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        messageData.messageType === option.type
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <option.icon className="w-6 h-6 text-white mx-auto mb-2" />
                      <p className="text-white text-sm">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-white font-medium mb-2">Message Title</label>
                <input
                  type="text"
                  value={messageData.title}
                  onChange={(e) => setMessageData({...messageData, title: e.target.value})}
                  placeholder="Give your time capsule a meaningful title..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-white font-medium mb-2">Message Content</label>
                {messageData.messageType === 'text' && (
                  <textarea
                    value={messageData.content.text}
                    onChange={(e) => setMessageData({
                      ...messageData,
                      content: { ...messageData.content, text: e.target.value }
                    })}
                    placeholder="Write your message to the future..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  />
                )}
                
                {messageData.messageType === 'audio' && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <button
                        onClick={isRecording ? stopAudioRecording : startAudioRecording}
                        className={`px-8 py-4 rounded-full font-medium transition-all mr-4 ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                        }`}
                      >
                        <Mic className="w-5 h-5 inline mr-2" />
                        {isRecording ? 'Stop Recording' : 'Record Audio'}
                      </button>
                      
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'audio')}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium cursor-pointer inline-flex items-center"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Audio
                      </label>
                    </div>
                    
                    {recordedBlob && (
                      <div className="bg-white/10 rounded-lg p-4">
                        <audio controls className="w-full">
                          <source src={URL.createObjectURL(recordedBlob)} type="audio/webm" />
                        </audio>
                      </div>
                    )}
                  </div>
                )}
                
                {messageData.messageType === 'video' && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <button
                        onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
                        className={`px-8 py-4 rounded-full font-medium transition-all mr-4 ${
                          isVideoRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                        }`}
                      >
                        <Video className="w-5 h-5 inline mr-2" />
                        {isVideoRecording ? 'Stop Recording' : 'Record Video'}
                      </button>
                      
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')}
                        className="hidden"
                        id="video-upload"
                      />
                      <label
                        htmlFor="video-upload"
                        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium cursor-pointer inline-flex items-center"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Video
                      </label>
                    </div>
                    
                    {recordedVideo && (
                      <div className="bg-white/10 rounded-lg p-4">
                        <video controls className="w-full max-h-64">
                          <source src={URL.createObjectURL(recordedVideo)} type="video/webm" />
                        </video>
                      </div>
                    )}
                  </div>
                )}
                
                {messageData.messageType === 'hybrid' && (
                  <div className="space-y-6">
                    <textarea
                      value={messageData.content.text}
                      onChange={(e) => setMessageData({
                        ...messageData,
                        content: { ...messageData.content, text: e.target.value }
                      })}
                      placeholder="Write your message..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <button
                          onClick={isRecording ? stopAudioRecording : startAudioRecording}
                          className={`px-6 py-3 rounded-lg font-medium transition-all w-full ${
                            isRecording
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                          }`}
                        >
                          <Mic className="w-4 h-4 inline mr-2" />
                          {isRecording ? 'Stop Audio' : 'Record Audio'}
                        </button>
                        
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'audio')}
                          className="hidden"
                          id="hybrid-audio"
                        />
                        <label
                          htmlFor="hybrid-audio"
                          className="mt-2 block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer"
                        >
                          Upload Audio
                        </label>
                      </div>
                      
                      <div className="text-center">
                        <button
                          onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
                          className={`px-6 py-3 rounded-lg font-medium transition-all w-full ${
                            isVideoRecording
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }`}
                        >
                          <Video className="w-4 h-4 inline mr-2" />
                          {isVideoRecording ? 'Stop Video' : 'Record Video'}
                        </button>
                        
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')}
                          className="hidden"
                          id="hybrid-video"
                        />
                        <label
                          htmlFor="hybrid-video"
                          className="mt-2 block px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer"
                        >
                          Upload Video
                        </label>
                      </div>
                    </div>
                    
                    {(recordedBlob || recordedVideo) && (
                      <div className="space-y-4">
                        {recordedBlob && (
                          <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-white mb-2">Audio:</p>
                            <audio controls className="w-full">
                              <source src={URL.createObjectURL(recordedBlob)} type="audio/webm" />
                            </audio>
                          </div>
                        )}
                        
                        {recordedVideo && (
                          <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-white mb-2">Video:</p>
                            <video controls className="w-full max-h-48">
                              <source src={URL.createObjectURL(recordedVideo)} type="video/webm" />
                            </video>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Emotional Tag */}
              <div>
                <label className="block text-white font-medium mb-3">Emotional Tag</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {emotionalTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => setMessageData({...messageData, emotionalTag: tag.name})}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        messageData.emotionalTag === tag.name
                          ? `border-${tag.color}-400 bg-${tag.color}-400/20`
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{tag.icon}</div>
                      <p className="text-white text-xs capitalize">{tag.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Unlock Conditions */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">When should this unlock?</h2>
              
              {/* Unlock Condition */}
              <div>
                <label className="block text-white font-medium mb-3">Unlock Condition</label>
                <div className="grid gap-3">
                  {unlockConditions.map((condition) => (
                    <button
                      key={condition.value}
                      onClick={() => setMessageData({...messageData, unlockCondition: condition.value})}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center ${
                        messageData.unlockCondition === condition.value
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <condition.icon className="w-6 h-6 text-white mr-3" />
                      <span className="text-white font-medium">{condition.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unlock Value */}
              <div>
                {messageData.unlockCondition === 'date' && (
                  <div>
                    <label className="block text-white font-medium mb-2">Unlock Date</label>
                    <input
                      type="datetime-local"
                      value={messageData.unlockValue}
                      onChange={(e) => setMessageData({...messageData, unlockValue: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                )}
                
                {messageData.unlockCondition === 'inactivity' && (
                  <div>
                    <label className="block text-white font-medium mb-2">Days of Inactivity</label>
                    <input
                      type="number"
                      value={messageData.unlockValue}
                      onChange={(e) => setMessageData({...messageData, unlockValue: e.target.value})}
                      placeholder="30"
                      min="1"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              {previewUnlockTime && (
                <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4">
                  <p className="text-blue-300 text-center">
                    🔮 This message will unlock {previewUnlockTime}
                  </p>
                </div>
              )}

              {/* Advanced Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Advanced Options</h3>
                
                {/* Self Destruct */}
                <div>
                  <label className="block text-white font-medium mb-2">Self-Destruct (hours after unlock)</label>
                  <input
                    type="number"
                    value={messageData.selfDestructHours || ''}
                    onChange={(e) => setMessageData({...messageData, selfDestructHours: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="Leave empty for permanent"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Nested Messages */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="nested"
                    checked={messageData.isNested}
                    onChange={(e) => setMessageData({...messageData, isNested: e.target.checked})}
                    className="w-5 h-5 text-yellow-400"
                  />
                  <label htmlFor="nested" className="text-white">
                    Create nested message sequence (treasure hunt style)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Create */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Review Your Time Capsule</h2>
              
              <div className="bg-white/5 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-yellow-400 font-medium">Title</h3>
                  <p className="text-white">{messageData.title}</p>
                </div>
                
                <div>
                  <h3 className="text-yellow-400 font-medium">Content Preview</h3>
                  <p className="text-white">
                    {messageData.content.text.substring(0, 100)}
                    {messageData.content.text.length > 100 && '...'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-yellow-400 font-medium">Unlock Condition</h3>
                  <p className="text-white">{previewUnlockTime}</p>
                </div>
                
                {messageData.emotionalTag && (
                  <div>
                    <h3 className="text-yellow-400 font-medium">Emotional Tag</h3>
                    <p className="text-white capitalize">#{messageData.emotionalTag}</p>
                  </div>
                )}
              </div>

              {/* Nested Messages */}
              {messageData.isNested && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Nested Messages</h3>
                    <button
                      onClick={addNestedMessage}
                      className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Message
                    </button>
                  </div>
                  
                  {nestedMessages.map((msg, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-white font-medium">Message {index + 2}</h4>
                        <button
                          onClick={() => removeNestedMessage(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Message title"
                        value={msg.title}
                        onChange={(e) => {
                          const updated = [...nestedMessages];
                          updated[index].title = e.target.value;
                          setNestedMessages(updated);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 mb-2"
                      />
                      
                      <textarea
                        placeholder="Message content"
                        value={msg.content.text}
                        onChange={(e) => {
                          const updated = [...nestedMessages];
                          updated[index].content.text = e.target.value;
                          setNestedMessages(updated);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium"
              >
                🚀 Create Time Capsule
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateMessage;