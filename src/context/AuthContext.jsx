import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.id && parsedUser.email) {
            // Ensure role is set (default to 'admin' if missing)
            if (!parsedUser.role) {
              parsedUser.role = 'admin';
            }
            // Ensure permissions array exists
            if (!parsedUser.permissions) {
              parsedUser.permissions = [];
            }
            setUser(parsedUser);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      }
      
      setUser(null);
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      // Clear cache before login
      try {
        const { apiCache } = await import('../utils/cache');
        apiCache.clear();
      } catch (e) {}
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      if (!token || !user || !user.id || !user.email) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure role and permissions
      if (!user.role) user.role = 'admin';
      if (!user.permissions) user.permissions = [];
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Clear IndexedDB after successful login
      try {
        const { localDB } = await import('../utils/localDB');
        await localDB.clearAll();
      } catch (e) {}
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      if (!user.role) user.role = 'admin';
      if (!user.permissions) user.permissions = [];
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Clear all API cache
    try {
      const { apiCache } = await import('../utils/cache');
      apiCache.clear();
    } catch (e) {}
    
    // Clear IndexedDB
    try {
      const { localDB } = await import('../utils/localDB');
      await localDB.clearAll();
    } catch (e) {}
  };

  const updateUser = (userData) => {
    if (!userData.role) userData.role = user?.role || 'admin';
    if (!userData.permissions) userData.permissions = user?.permissions || [];
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    userRole: user?.role,
    userPermissions: user?.permissions || []
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};