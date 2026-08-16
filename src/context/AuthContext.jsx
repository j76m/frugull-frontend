import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_KEY = 'frugull_session_token';
const USER_KEY = 'frugull_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" = we're verifying an existing token on app load, before we
  // know whether to show the app or the login screen.
  const [status, setStatus] = useState('checking'); // checking | authed | guest

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus('guest');
      return;
    }
    // We have a token from a previous session — verify it's still valid
    // by asking the backend who we are, rather than trusting stale
    // localStorage data.
    authApi
      .fetchMe()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setStatus('authed');
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setStatus('guest');
      });
  }, []);

  function completeLogin({ user: loggedInUser, token }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setStatus('authed');
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Even if the backend call fails, we still clear the local session
      // so the user isn't stuck logged in on this device.
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setStatus('guest');
  }

  const value = { user, status, completeLogin, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
