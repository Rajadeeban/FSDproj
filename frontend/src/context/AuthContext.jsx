import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('greenh2_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('greenh2_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('greenh2_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('greenh2_token');
        localStorage.removeItem('greenh2_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('greenh2_token', token);
    localStorage.setItem('greenh2_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('greenh2_token', token);
    localStorage.setItem('greenh2_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('greenh2_token');
    localStorage.removeItem('greenh2_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
