/**
 * Authentication Provider
 * 
 * Manages Firebase authentication state with automatic session persistence.
 * Implements the Observer pattern via `onAuthStateChanged` to detect when
 * Firebase restores a cached session from IndexedDB/LocalStorage.
 * 
 * Features:
 * - Automatic session restoration on app load
 * - 8-second timeout with fail-open behavior
 * - Centralized logout helper for consistent sign-out
 * - React Context for app-wide auth state access
 * 
 * @see documentation/change-log-journal/v2_changelog/2026-02-13-auto-sign-in.md
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  hasTimedOut: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  hasTimedOut: false,
  logout: async () => {
    throw new Error('AuthProvider not initialized');
  },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  /**
   * Centralized logout function.
   * Signs out the user and clears the Firebase auth session.
   * The `onAuthStateChanged` observer will automatically update state to `user: null`.
   */
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Signing out user");
      await firebaseSignOut(auth);
      console.log("[Auth] Sign-out successful");
    } catch (error) {
      console.error("[Auth] Sign-out failed", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    console.log("[Auth] onAuthStateChanged listener registered");
    
    // Observer pattern: listens for auth state changes from Firebase
    // This fires immediately and checks IndexedDB for cached credentials
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] Auth state resolved", { hasUser: Boolean(user) });
      setUser(user);
      setLoading(false);
    });

    // Fail-open timeout: prevent infinite loading if Firebase fails to respond
    const timeoutId = window.setTimeout(() => {
      console.warn("[Auth] Auth initialization timeout (8s)");
      setHasTimedOut(true);
      setLoading(false);
    }, 8000);

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasTimedOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication state and actions.
 * 
 * @returns {AuthContextValue} Current user, loading state, timeout flag, and logout function
 * @example
 * const { user, loading, logout } = useAuth();
 * if (user) { await logout(); }
 */
export const useAuth = () => useContext(AuthContext);