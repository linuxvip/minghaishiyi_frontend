import userClient from './client';
import {
  UserInfo,
  UserCaseRecord,
  FavoriteRecord,
  FavoriteObjectType,
} from '../types';

export const registerApi = async (data: {
  username: string;
  password: string;
  password2: string;
  nickname?: string;
}): Promise<{ tokens: { access: string; refresh: string }; user: UserInfo }> => {
  const { data: res } = await userClient.post('/auth/register/', data);
  return res;
};

export const loginApi = async (data: {
  username: string;
  password: string;
}): Promise<{ access: string; refresh: string }> => {
  const { data: res } = await userClient.post('/auth/login/', data);
  return res;
};

export const logoutApi = async (refresh: string): Promise<void> => {
  await userClient.post('/auth/logout/', { refresh });
};

export const getMeApi = async (): Promise<UserInfo> => {
  const { data } = await userClient.get('/auth/me/');
  return data;
};

export const updateMeApi = async (payload: { nickname?: string }): Promise<UserInfo> => {
  const { data } = await userClient.put('/auth/me/', payload);
  return data;
};

export const getUserConfigApi = async (): Promise<Record<string, unknown>> => {
  const { data } = await userClient.get('/user/config/');
  return data;
};

export const putUserConfigApi = async (
  preferences: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const { data } = await userClient.put('/user/config/', preferences);
  return data;
};

export const listUserCasesApi = async (): Promise<UserCaseRecord[]> => {
  const { data } = await userClient.get('/user/cases/');
  return data;
};

export const createUserCaseApi = async (payload: {
  gender: number;
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  subject_name: string;
  notes: string;
  input_snapshot: Record<string, unknown>;
}): Promise<UserCaseRecord> => {
  const { data } = await userClient.post('/user/cases/', payload);
  return data;
};

export const updateUserCaseApi = async (
  id: number,
  payload: Partial<{
    subject_name: string;
    notes: string;
    input_snapshot: Record<string, unknown>;
  }>,
): Promise<UserCaseRecord> => {
  const { data } = await userClient.patch(`/user/cases/${id}/`, payload);
  return data;
};

export const deleteUserCaseApi = async (id: number): Promise<void> => {
  await userClient.delete(`/user/cases/${id}/`);
};

export const listFavoritesApi = async (
  objectType?: FavoriteObjectType,
): Promise<FavoriteRecord[]> => {
  const params = objectType ? { object_type: objectType } : {};
  const { data } = await userClient.get('/user/favorites/', { params });
  return data;
};

export const getFavoriteStatusApi = async (
  objectType: FavoriteObjectType,
  objectId: number,
): Promise<{ favorited: boolean; id: number | null }> => {
  const { data } = await userClient.get('/user/favorites/status/', {
    params: { object_type: objectType, object_id: objectId },
  });
  return data;
};

export const toggleFavoriteApi = async (
  objectType: FavoriteObjectType,
  objectId: number,
): Promise<{ favorited: boolean; id: number | null }> => {
  const { data } = await userClient.post('/user/favorites/toggle/', {
    object_type: objectType,
    object_id: objectId,
  });
  return data;
};
