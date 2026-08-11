import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  registerApi,
  loginApi,
  logoutApi,
  getMeApi,
  updateMeApi,
  putUserConfigApi,
} from '../api/userApi';
import {
  getUserAccessToken,
  getUserRefreshToken,
  setUserTokens,
  clearUserTokens,
} from '../api/client';
import { UserInfo } from '../types';

interface JwtPayload {
  exp: number;
  user_id?: number;
}

interface UserAuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UserAuthContextType extends UserAuthState {
  login: (username: string, password: string) => Promise<UserInfo>;
  register: (data: {
    username: string;
    password: string;
    password2: string;
    nickname?: string;
  }) => Promise<UserInfo>;
  logout: () => Promise<void>;
  updateProfile: (nickname: string) => Promise<UserInfo>;
  preferences: Record<string, unknown>;
  updatePreferences: (prefs: Record<string, unknown>) => Promise<void>;
}

export const UserAuthContext = createContext<UserAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('not ready'); },
  register: async () => { throw new Error('not ready'); },
  logout: async () => {},
  updateProfile: async () => { throw new Error('not ready'); },
  preferences: {},
  updatePreferences: async () => {},
});

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getUserRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    return false;
  }
  try {
    const res = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('mhsy_user_access', data.access);
    return true;
  } catch {
    return false;
  }
};

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});

  const applyUser = useCallback((user: UserInfo) => {
    setState({ user, isAuthenticated: true, isLoading: false });
    setPreferences(user.preferences ?? {});
  }, []);

  const clearAuth = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false });
    setPreferences({});
  }, []);

  useEffect(() => {
    const init = async () => {
      const access = getUserAccessToken();
      if (!access) {
        clearAuth();
        return;
      }
      let ok = !isTokenExpired(access);
      if (!ok) ok = await refreshAccessToken();
      if (!ok) {
        clearUserTokens();
        clearAuth();
        return;
      }
      try {
        const user = await getMeApi();
        applyUser(user);
      } catch {
        clearUserTokens();
        clearAuth();
      }
    };
    init();
  }, [applyUser, clearAuth]);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await loginApi({ username, password });
    setUserTokens(tokens);
    const user = await getMeApi();
    applyUser(user);
    return user;
  }, [applyUser]);

  const register = useCallback(async (data: {
    username: string;
    password: string;
    password2: string;
    nickname?: string;
  }) => {
    const res = await registerApi(data);
    setUserTokens(res.tokens);
    applyUser(res.user);
    return res.user;
  }, [applyUser]);

  const logout = useCallback(async () => {
    const refresh = getUserRefreshToken();
    if (refresh) {
      try { await logoutApi(refresh); } catch { /* ignore */ }
    }
    clearUserTokens();
    clearAuth();
  }, [clearAuth]);

  const updateProfile = useCallback(async (nickname: string) => {
    const updated = await updateMeApi({ nickname });
    setState({ user: updated, isAuthenticated: true, isLoading: false });
    return updated;
  }, []);

  const updatePreferences = useCallback(async (prefs: Record<string, unknown>) => {
    setPreferences(prefs);
    try {
      await putUserConfigApi(prefs);
    } catch {
      // 云端同步失败时本地仍生效，下次排盘提交会重试
    }
  }, []);

  return (
    <UserAuthContext.Provider value={{ ...state, login, register, logout, updateProfile, preferences, updatePreferences }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
