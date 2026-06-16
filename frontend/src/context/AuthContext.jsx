import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      api.defaults.headers.common['x-auth-token'] = token;
      const res = await api.get('/auth/user');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    api.defaults.headers.common['x-auth-token'] = res.data.token;
    await loadUser();
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    api.defaults.headers.common['x-auth-token'] = res.data.token;
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  const updatePreferences = async (prefs) => {
    const res = await api.put('/auth/preferences', prefs);
    setUser((prev) => ({ ...prev, preferences: res.data }));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updatePreferences }}
    >
      {children}
    </AuthContext.Provider>
  );
};