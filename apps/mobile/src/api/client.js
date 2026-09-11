import * as Crypto from 'expo-crypto';
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


const pendingWrites = new Map();
api.interceptors.request.use(config => {
  if (config.method === 'post' && ['/billing/payments', '/inspections/mobile-intake', '/inspections/mobile-intake-v3'].includes(config.url) && config.data && !config.data.requestKey) {
    const identity = config.url + ':' + JSON.stringify(config.data);
    if (!pendingWrites.has(identity)) pendingWrites.set(identity, Crypto.randomUUID());
    config.data = { ...config.data, requestKey: pendingWrites.get(identity) };
    config.workflowRequestIdentity = identity;
  }
  return config;
});
api.interceptors.response.use(response => {
  if (response.config.workflowRequestIdentity) pendingWrites.delete(response.config.workflowRequestIdentity);

  return response;
});

export default api;
