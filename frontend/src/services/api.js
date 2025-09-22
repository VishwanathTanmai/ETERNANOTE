import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eternanote_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Suppress all errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.resolve({ data: {} });
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
};

// Message services
export const messageService = {
  create: (messageData) => api.post('/messages/create', messageData),
  getMyMessages: (params) => api.get('/messages/my-messages', { params }),
  getMessage: (messageId) => api.get(`/messages/${messageId}`),
  getEchoFeed: () => api.get('/messages/echo/today'),
  createNested: (messages) => api.post('/messages/nested', { messages }),
};

// Social services
export const socialService = {
  getCollisionWall: (date) => api.get(`/social/collision/${date}`),
  getInsights: (timeframe) => api.get('/social/insights', { params: { timeframe } }),
  createReflectionReply: (data) => api.post('/social/reflection-reply', data),
  getThreads: () => api.get('/social/threads'),
  createThread: (threadData) => api.post('/social/threads', threadData),
  joinThread: (threadId) => api.post(`/social/threads/${threadId}/join`),
  getFeed: (params) => api.get('/social/feed', { params }),
  getEmotionalAnalytics: (params) => api.get('/social/emotions/analytics', { params }),
  createRipple: (messageId, data) => api.post(`/social/ripple/${messageId}`, data),
  getTodayCollisions: () => api.get('/social/collisions/today'),
  getCollisionHistory: (params) => api.get('/social/collisions/history', { params }),
  getSerendipitousConnections: (date) => api.get(`/social/connections/${date}`),
};

// Profile services
export const profileService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  getTrustedContacts: () => api.get('/profile/trusted-contacts'),
  addTrustedContact: (data) => api.post('/profile/trusted-contacts', data),
  enableLegacyMode: (enable) => api.post('/profile/legacy-mode', { enable }),
  getBadges: () => api.get('/profile/badges'),
  getEmotionalJourney: (params) => api.get('/profile/emotional-journey', { params }),
};

// Timeline services
export const timelineService = {
  getTimelines: () => api.get('/timeline'),
  createTimeline: (data) => api.post('/timeline', data),
  getTimelineMessages: (timelineId) => api.get(`/timeline/${timelineId}/messages`),
};

export default api;