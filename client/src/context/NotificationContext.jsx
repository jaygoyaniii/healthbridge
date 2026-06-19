import { createContext, useReducer, useCallback, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const { data } = await notificationService.getNotifications({ page: 1, limit: 10 });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data.notifications || [] });
      if (data.unreadCount !== undefined) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: data.unreadCount });
      }
    } catch (error) {
      console.error('Failed to fetch initial notifications:', error);
    }
  };

  const setNotifications = useCallback((data) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
  }, []);

  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const markRead = useCallback((id) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const setUnreadCount = useCallback((count) => {
    dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        setNotifications,
        addNotification,
        markRead,
        markAllRead,
        setUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
