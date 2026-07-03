/// <reference types="vite/client" />
import axios from 'axios';
import Keycloak from 'keycloak-js';

// Initialize Keycloak client instance matching docker configurations
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: 'fincorp-realm',
  clientId: 'fincorp-app',
});

// Configure Axios Client
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor to inject Keycloak Bearer token or mock credentials
api.interceptors.request.use(
  async (config) => {
    if (keycloak.token) {
      // Proactively refresh token if expired within 30 seconds
      try {
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error('Failed to refresh Keycloak token', error);
        keycloak.login();
      }
    } else {
      // Fallback: Inject mock developer headers for offline setup (Laragon/H2 database path)
      const mockEmail = localStorage.getItem('mock_user_email');
      const mockRole = localStorage.getItem('mock_user_role');
      if (mockEmail && mockRole) {
        config.headers['X-User-Email'] = mockEmail;
        config.headers['X-User-Role'] = mockRole;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
