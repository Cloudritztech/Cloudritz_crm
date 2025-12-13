import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔐 Auth init - token:', !!token, 'userData:', !!userData);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('✅ Restoring user session:', parsedUser);
          
          // Validate user object has required fields
          if (!parsedUser.id || !parsedUser.email) {
            console.error('❌ Invalid user data structure:', parsedUser);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('ℹ️ No stored auth found');
        setUser(null);
      }
      
      setLoading(false);
    };
    
    initAuth();

  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔑 Attempting login...');
      const response = await authAPI.login(credentials);
      console.log('✅ Login response received:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server - missing token or user');
      }
      
      if (!user.id || !user.email) {
        throw new Error('Invalid user data - missing required fields');
      }
      
      console.log('💾 Saving auth data...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify save
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (!savedToken || !savedUser) {
        throw new Error('Failed to save auth data to localStorage');
      }
      
      console.log('✅ Auth data saved successfully');
      console.log('👤 User:', user);
      
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error);
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

  const logout = () => {
    console.log('Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
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
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};