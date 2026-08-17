import axios from 'axios';

const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Use admin token for admin routes, otherwise use the regular user token
      const isAdminRoute = config.url?.startsWith('/admin') || config.url?.includes('/admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
      const adminToken = localStorage.getItem('admin_token');
      const userToken = localStorage.getItem('nexora_token');
      const token = (isAdminRoute && adminToken) ? adminToken : (userToken || adminToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default api;
