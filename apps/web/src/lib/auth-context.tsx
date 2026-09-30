'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  provider: 'google' | 'email';
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    targetRole?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (customData?: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'hireflow_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to parse auth user from storage', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    // Set a lightweight cookie for middleware / server compatibility if needed
    document.cookie = `hireflow_session=true; path=/; max-age=2592000; SameSite=Lax`;
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      if (!email || !password) {
        return { success: false, error: 'Please enter both email and password' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const cleanEmail = email.trim().toLowerCase();
      const derivedName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const authUser: AuthUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name: derivedName,
        email: cleanEmail,
        role: 'Candidate / Engineer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}&backgroundColor=00b074,0ea5e9,6366f1`,
        provider: 'email',
        createdAt: new Date().toISOString(),
      };

      saveUserSession(authUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    targetRole?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 700));

      if (!name.trim()) {
        return { success: false, error: 'Please enter your full name' };
      }
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const authUser: AuthUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: targetRole?.trim() || 'Software Engineer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=00b074,0ea5e9,6366f1`,
        provider: 'email',
        createdAt: new Date().toISOString(),
      };

      saveUserSession(authUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (customData?: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      const googleEmail = customData?.email || 'candidate@gmail.com';
      const googleName = customData?.name || googleEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const authUser: AuthUser = {
        id: 'g_usr_' + Math.random().toString(36).substring(2, 9),
        name: googleName,
        email: googleEmail,
        role: customData?.role || 'Full-Stack Developer',
        avatar:
          customData?.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };

      saveUserSession(authUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `hireflow_session=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
