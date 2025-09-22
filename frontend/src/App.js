import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CreateMessage from './pages/CreateMessage';
import CollisionWall from './pages/CollisionWall';
import Profile from './pages/Profile';
import Timeline from './pages/Timeline';
import EchoFeed from './pages/EchoFeed';

import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/create" 
          element={user ? <CreateMessage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/collision/:date?" 
          element={user ? <CollisionWall /> : <Navigate to="/" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/" />} 
        />
        <Route 
          path="/timeline" 
          element={user ? <Timeline /> : <Navigate to="/" />} 
        />
        <Route 
          path="/echo" 
          element={user ? <EchoFeed /> : <Navigate to="/" />} 
        />

      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;