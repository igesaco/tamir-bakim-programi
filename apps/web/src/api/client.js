import axios from 'axios';

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token');

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  },
);


const pendingWrites = new Map();
api.interceptors.request.use(config => {
  if (config.method === 'post' && ['/billing/payments', '/inspections/mobile-intake', '/inspections/mobile-intake-v3'].includes(config.url) && config.data && !config.data.requestKey) {
    const identity = config.url + ':' + JSON.stringify(config.data);
    if (!pendingWrites.has(identity)) pendingWrites.set(identity, crypto.randomUUID());
    config.data = { ...config.data, requestKey: pendingWrites.get(identity) };
    config.workflowRequestIdentity = identity;
  }
  return config;
});
api.interceptors.response.use(response => {
  if (response.config.workflowRequestIdentity) pendingWrites.delete(response.config.workflowRequestIdentity);
  if (['post','patch','delete'].includes(response.config.method)) window.dispatchEvent(new Event('service-data-changed'));
  return response;
});

export default api;
