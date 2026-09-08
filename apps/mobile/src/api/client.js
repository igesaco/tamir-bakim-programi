import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const fallbackUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://127.0.0.1:3000';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  fallbackUrl
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token =
      await SecureStore.getItemAsync(
        'tb_token',
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

export default api;
