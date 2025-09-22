import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('eternanote_token');
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Connected to EternaNote server');
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Disconnected from server');
      });

      newSocket.on('message_unlocked', (data) => {
        toast.success(`Time capsule "${data.title}" has unlocked! 🕰️`, {
          duration: 6000,
          icon: '🔓'
        });
      });

      newSocket.on('memory_collision', (data) => {
        toast.success(`Memory collision detected: ${data.theme} 💫`, {
          duration: 8000,
          icon: '✨'
        });
      });

      newSocket.on('messages_unlocked', (messages) => {
        messages.forEach(msg => {
          toast.success(`"${msg.title}" unlocked!`, {
            duration: 5000,
            icon: '🔓'
          });
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user]);

  const checkUnlocks = () => {
    if (socket) {
      socket.emit('check_unlocks');
    }
  };

  const joinCollisionRoom = (date) => {
    if (socket) {
      socket.emit('join_collision_room', date);
    }
  };

  const joinThread = (threadId) => {
    if (socket) {
      socket.emit('join_thread', threadId);
    }
  };

  const value = {
    socket,
    connected,
    checkUnlocks,
    joinCollisionRoom,
    joinThread
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};