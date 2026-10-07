import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { User, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, identifier: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; status?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      const storedToken = localStorage.getItem('chat_token');
      if (!storedToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const data = await api.get<{ user: User }>('/auth/me');
        if (mounted && data.user) {
          setUser(data.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        localStorage.removeItem('chat_token');
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { identifier, password });
    localStorage.setItem('chat_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, identifier: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/register', { name, identifier, password });
    localStorage.setItem('chat_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; status?: string; avatar?: string }) => {
    const res = await api.put<{ user: User }>('/auth/profile', data);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('chat_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
