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

// Simple in-memory cache for GET requests
const apiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const originalGet = api.get;
api.get = async function (url: string, config?: any) {
  // Only cache GET requests that don't explicitly disable it
  const cacheKey = url + (config?.params ? JSON.stringify(config.params) : '');
  
  if (cacheKey && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data);
    } else {
      apiCache.delete(cacheKey);
    }
  }

  const response: any = await originalGet.call(api, url, config);
  
  if (response.status >= 200 && response.status < 300) {
    // Only cache public routes or data that is safe to cache
    if (url.includes('/public/')) {
      apiCache.set(cacheKey, { timestamp: Date.now(), data: response });
    }
  }
  
  return response;
};

export default api;
