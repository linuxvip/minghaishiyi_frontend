import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { loginApi, logoutApi, getMeApi } from '../api/auth';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../api/client';
import { AdminUser } from '../types/admin';

interface JwtPayload {
  exp: number;
  user_id?: number;
  username?: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshIfNeeded = useCallback(async (): Promise<boolean> => {
    const accessToken = getAccessToken();
    if (accessToken && !isTokenExpired(accessToken)) {
      return true;
    }
    const refreshToken = getRefreshToken();
    if (!refreshToken || isTokenExpired(refreshToken)) {
      return false;
    }
    try {
      const { data } = await axios.post('/admin-api/auth/refresh/', { refresh: refreshToken });
      setTokens({ access: data.access, refresh: refreshToken });
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const tokenValid = await refreshIfNeeded();
      if (!tokenValid) {
        clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      try {
        const { data } = await getMeApi();
        const u = data as unknown as AdminUser;
        if (!u.is_superuser) {
          clearTokens();
          setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        setState({ user: u, isAuthenticated: true, isLoading: false });
      } catch {
        clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };
    init();
  }, [refreshIfNeeded]);

  const login = useCallback(async (username: string, password: string) => {
    await loginApi({ username, password });
    try {
      const { data } = await getMeApi();
      const u = data as unknown as AdminUser;
      if (!u.is_superuser) {
        throw new Error('无后台管理权限');
      }
      setState({ user: u, isAuthenticated: true, isLoading: false });
    } catch (e) {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    clearTokens();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
