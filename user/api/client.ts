import axios from 'axios';

const ACCESS_TOKEN_KEY = 'mhsy_user_access';
const REFRESH_TOKEN_KEY = 'mhsy_user_refresh';

export const getUserAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getUserRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setUserTokens = (tokens: { access: string; refresh: string }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
};

export const clearUserTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const userClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

userClient.interceptors.request.use((config) => {
  const token = getUserAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

userClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return userClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getUserRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        const { data } = await axios.post('/api/auth/refresh/', { refresh: refreshToken });
        const newAccess = data.access;
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return userClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearUserTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default userClient;
