import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import NotificationPopup from '@/components/NotificationPopup';

type NotificationType = 'success' | 'error';

interface NotificationState {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  
  // Gunakan NodeJS.Timeout untuk tipe yang tepat
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    // Clear existing timer jika ada
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setNotification({ message, type });

    // Set timer baru untuk auto-dismiss
    timerRef.current = setTimeout(() => {
      handleClose();
    }, 3000); // Auto-dismiss setelah 3 detik
  }, []);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationPopup
        visible={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'success'}
        onClose={handleClose}
      />
    </NotificationContext.Provider>
  );
};