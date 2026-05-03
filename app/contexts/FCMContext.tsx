'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { requestNotificationPermission, onForegroundMessage } from '../lib/fcm';
import toast from 'react-hot-toast';

interface FCMContextType {
  fcmToken: string | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
}

const FCMContext = createContext<FCMContextType | undefined>(undefined);

export const useFCM = () => {
  const context = useContext(FCMContext);
  if (!context) throw new Error('useFCM must be used within FCMProvider');
  return context;
};

export const FCMProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isGuest } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request permission and get token
  const requestPermission = async () => {
    if (!user || isGuest) {
      toast.error('Please login to enable notifications');
      return;
    }

    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setFcmToken(token);
        setPermissionGranted(true);
        toast.success('Notifications enabled!');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  // Check notification permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Request permission when user logs in (optional - can be manual)
  useEffect(() => {
    if (user && !isGuest && !permissionGranted) {
      // Auto-request permission (optional, can be removed for manual)
      // requestPermission();
    }
  }, [user, isGuest, permissionGranted]);

  // Listen for foreground messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      onForegroundMessage((payload) => {
        // Show toast notification for foreground messages
        if (payload.notification) {
          toast.custom((t) => (
            <div className="bg-white rounded-lg shadow-lg p-3 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{payload.notification.title}</h4>
                  <p className="text-xs text-gray-600">{payload.notification.body}</p>
                </div>
                <button onClick={() => toast.dismiss(t.id)} className="text-gray-400">
                  ✕
                </button>
              </div>
            </div>
          ));
        }
      });
    }
  }, []);

  return (
    <FCMContext.Provider value={{
      fcmToken,
      permissionGranted,
      requestPermission
    }}>
      {children}
    </FCMContext.Provider>
  );
};