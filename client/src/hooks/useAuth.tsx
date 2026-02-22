import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { Player } from '../types';

interface AuthContextType {
  player: Player | null;
  firebaseUser: User | null;
  loading: boolean;
  /** Sign in with Firebase email/password */
  login: (email: string, password: string) => Promise<void>;
  /** Register via Firebase then set up player profile */
  register: (username: string, email: string, password: string, minecraftUuid?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** Get a fresh Firebase ID token for API calls */
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = '/api';

async function syncProfile(user: User, body?: { username: string; minecraftUuid?: string }): Promise<Player> {
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Profile sync failed');
  }
  const data = await res.json();
  return data.player as Player;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await syncProfile(user);
          setPlayer(profile);
        } catch {
          setPlayer(null);
        }
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will pick up the new user and call syncProfile
  };

  const register = async (username: string, email: string, password: string, minecraftUuid?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Sync profile to our DB immediately with the username
    const profile = await syncProfile(cred.user, { username, minecraftUuid });
    setPlayer(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setPlayer(null);
  };

  const getToken = async (): Promise<string> => {
    if (!firebaseUser) throw new Error('Not authenticated');
    return firebaseUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ player, firebaseUser, loading, login, register, logout, isAuthenticated: !!player, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

