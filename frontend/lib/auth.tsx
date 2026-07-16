import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from './storage';
import { actions, refresh } from './store';
import { User } from './types';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  login: async () => 'Not ready',
  logout: () => {},
});

const SESSION_KEY = 'session.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restore session on app startup using stored JWT — no password needed
  useEffect(() => {
    storage.getItem(SESSION_KEY)
      .then(async (token: string | null) => {
        if (token) {
          const found = await actions.verifySession(token);
          if (found) {
            setUser(found);
          } else {
            await storage.removeItem(SESSION_KEY);
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh(user._id);
    const interval = setInterval(() => {
      refresh(user._id);
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string): Promise<string | null> => {
    if (!email.trim()) return 'Email is required.';
    if (!password.trim()) return 'Password is required.';
    try {
      const { user: found, sessionToken } = await actions.login(email, password);
      setUser(found);
      await storage.setItem(SESSION_KEY, sessionToken);
      return null;
    } catch (e: unknown) {
      if (e instanceof Error) return e.message;
      return 'Login failed. Please try again.';
    }
  };

  const logout = async () => {
    setUser(null);
    await storage.removeItem(SESSION_KEY);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
