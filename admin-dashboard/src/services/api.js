import axios from 'axios';

const TOKEN_KEY = 'florana_admin_token';
const ROLE_KEY = 'florana_admin_role';
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const LEGACY_API_BASE_URL = 'http://localhost:8001';

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
const candidateApiBaseUrls = Array.from(new Set([configuredApiBaseUrl, DEFAULT_API_BASE_URL, LEGACY_API_BASE_URL]));

const client = axios.create({
  baseURL: configuredApiBaseUrl,
  timeout: 10000,
});

const normalizeErrorMessage = (error) => {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item?.message || String(item)).join(', ');
  }
  return detail || error.message || 'Something went wrong';
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const requestWithFallback = async (config) => {
  let lastError;

  for (const baseURL of candidateApiBaseUrls) {
    try {
      const response = await client.request({ ...config, baseURL });
      client.defaults.baseURL = baseURL;
      return response.data;
    } catch (error) {
      lastError = error;
      if (error.response) {
        if (error.response.status === 401) {
          auth.logout();
          throw new Error('Your admin session expired. Please log in again.');
        }
        if (![404, 405].includes(error.response.status) || baseURL === candidateApiBaseUrls[candidateApiBaseUrls.length - 1]) {
          throw new Error(normalizeErrorMessage(error));
        }
      }
    }
  }

  throw lastError;
};

export const auth = {
  tokenKey: TOKEN_KEY,
  roleKey: ROLE_KEY,
  isAdmin: () => Boolean(localStorage.getItem(TOKEN_KEY)) && localStorage.getItem(ROLE_KEY) === 'admin',
  login: async (email, password) => {
    const data = await requestWithFallback({
      method: 'post',
      url: '/auth/login',
      data: { email, password },
    });
    if (data.role !== 'admin') {
      throw new Error('Only admin users can access the dashboard.');
    }
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(ROLE_KEY, data.role);
    return data;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};

export const api = {
  getSummary: () => requestWithFallback({ method: 'get', url: '/admin/summary' }),
  getUsers: () => requestWithFallback({ method: 'get', url: '/admin/users' }),
  getPlants: () => requestWithFallback({ method: 'get', url: '/admin/plants' }),
  getProducts: () => requestWithFallback({ method: 'get', url: '/admin/products' }),
  getFeedback: () => requestWithFallback({ method: 'get', url: '/admin/feedback' }),
  getPayments: () => requestWithFallback({ method: 'get', url: '/admin/payments' }),
  deletePlant: (id) => requestWithFallback({ method: 'delete', url: `/admin/plants/${id}` }),
  deleteProduct: (id) => requestWithFallback({ method: 'delete', url: `/admin/products/${id}` }),
  deletePayment: (id) => requestWithFallback({ method: 'delete', url: `/admin/payments/${id}` }),
};
