import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to fetch user', e);
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      return { success: true };
    }
    const err = await res.json();
    return { success: false, error: err.error || 'Login failed' };
  };

  const register = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      return { success: true };
    }
    const err = await res.json();
    return { success: false, error: err.error || 'Registration failed' };
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const updateProfile = async (updates) => {
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Update failed' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

