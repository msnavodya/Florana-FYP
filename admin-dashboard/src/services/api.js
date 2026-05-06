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
        throw error;
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
  getUsers: () => requestWithFallback({ method: 'get', url: '/admin/users' }),
  getPlants: () => requestWithFallback({ method: 'get', url: '/admin/plants' }),
  getProducts: () => requestWithFallback({ method: 'get', url: '/admin/products' }),
  deletePlant: (id) => requestWithFallback({ method: 'delete', url: `/admin/plants/${id}` }),
  deleteProduct: (id) => requestWithFallback({ method: 'delete', url: `/admin/products/${id}` }),
};
