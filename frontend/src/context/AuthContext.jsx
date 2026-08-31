import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartspend_user');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('smartspend_token') || null;
    } catch (err) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('smartspend_token');
      localStorage.removeItem('smartspend_user');
    } catch (err) {
      console.error('Error clearing localStorage', err);
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data && res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data && res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartspend_token', res.data.token);
      localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password, currency) => {
    const res = await authAPI.register({ name, email, password, currency });
    if (res.data && res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartspend_token', res.data.token);
      localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
