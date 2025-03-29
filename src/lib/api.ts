import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  signup: async (email: string, password: string) => {
    const response = await api.post('/auth/signup', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};

export const sessions = {
  create: async (sessionData: any) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },
  getErrorPatterns: async () => {
    const response = await api.get('/analysis/error-patterns');
    return response.data;
  },
  getPsychologicalInsights: async () => {
    const response = await api.get('/analysis/psychological');
    return response.data;
  }
};