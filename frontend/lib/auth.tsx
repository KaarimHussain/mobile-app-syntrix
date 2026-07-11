import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from './storage';
import { actions, refresh } from './store';
import { User } from './types';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>; // returns error message
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  login: async () => 'Not ready',
  logout: () => {},
});

const SESSION_KEY = 'session.email';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getItem(SESSION_KEY)
      .then(async (email: string | null) => {
        if (email) {
          const found = await actions.login(email);
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
    // Initial refresh
    refresh(user._id);
    // Poll updates every 4 seconds to sync with server/other employees
    const interval = setInterval(() => {
      refresh(user._id);
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    if (!password.trim()) return 'Password is required.';
    const found = await actions.login(email);
    if (!found) return 'No active account with that email.';
    setUser(found);
    await storage.setItem(SESSION_KEY, found.email);
    return null;
  };

  const logout = async () => {
    setUser(null);
    await storage.removeItem(SESSION_KEY);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
