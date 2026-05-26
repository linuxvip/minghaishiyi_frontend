import adminClient from './client';
import { LoginCredentials, TokenPair } from '../types/admin';
import { setTokens, clearTokens } from './client';

export const loginApi = async (credentials: LoginCredentials): Promise<TokenPair> => {
  const { data } = await adminClient.post<TokenPair>('/admin-api/auth/login/', credentials);
  setTokens(data);
  return data;
};

export const logoutApi = () => {
  clearTokens();
  return adminClient.post('/admin-api/auth/logout/').catch(() => {});
};

export const refreshTokenApi = (refresh: string) =>
  adminClient.post<TokenPair>('/admin-api/auth/refresh/', { refresh });

export const getMeApi = () =>
  adminClient.get('/admin-api/auth/me/');
