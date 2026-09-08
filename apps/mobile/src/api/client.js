import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const productionApiUrl =
  'https://tamir-bakim-api.onrender.com';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  productionApiUrl
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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
