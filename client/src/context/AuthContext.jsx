import { createContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';
import useSocketStore from '../store/useSocketStore';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, user: null, token: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { connect, disconnect } = useSocketStore();

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('hb_token');
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'AUTH_LOADING' });
      const { data } = await api.get('/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token },
      });
      connect(token);
    } catch {
      localStorage.removeItem('hb_token');
      dispatch({ type: 'LOGOUT' });
      disconnect();
    }
  }, [connect, disconnect]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('hb_token', data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.accessToken },
      });
      connect(data.accessToken);
      return data;
    } catch (error) {
      const payload = error.response?.data || { message: 'Login failed' };
      dispatch({ type: 'AUTH_ERROR', payload: payload.message });
      throw payload;
    }
  }, [connect]);

  const register = useCallback(async (formData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('hb_token', data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.accessToken },
      });
      connect(data.accessToken);
      return data;
    } catch (error) {
      const payload = error.response?.data || { message: 'Registration failed' };
      dispatch({ type: 'AUTH_ERROR', payload: payload.message });
      throw payload;
    }
  }, [connect]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* silent fail */
    }
    localStorage.removeItem('hb_token');
    dispatch({ type: 'LOGOUT' });
    disconnect();
  }, [disconnect]);

  const updateUser = useCallback((userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        updateUser,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
