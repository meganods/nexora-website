import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // If accessing via a custom/ngrok domain, we assume the backend is also port forwarded or routed appropriately.
    // However, since only port 3000 (frontend) is exposed via ngrok here, the browser calls directly to localhost:5000 (which fails from external machines).
    // Let's resolve the host dynamically: if it's localhost, use localhost:5000. If it's a custom domain, point to the relative host port/scheme or fallback.
    // For local dev with ngrok exposing 3000, requests to 5000 from the external client fail unless the backend is also exposed or requests are proxied.
    // A clean approach is to use the current hostname but pointing to backend port if locally accessible, or check if we are on localhost vs ngrok.
    // Since the error specifically shows Axios Network Errors on pages loaded from 'uneasily-wildly-proactive.ngrok-free.dev', 
    // the client in the browser cannot connect to 'http://localhost:5000/api' if it's on a mobile device or separate machine.
    // However, if the user runs the browser on the mini itself, localhost:5000 is accessible.
    // If the browser is on the same machine but ngrok blocks dev resources, Next.js blocks it.
    // Let's check window.location.hostname. If it's not localhost, we fallback or try to route.
    // Actually, in local dev on the same machine, localhost:5000 should work. If it's a "Network Error", did the backend server crash or is it CORS?
    // Let's check window.location.origin
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // In a real tunnel scenario, if only 3000 is tunneled, we might need to fallback to localhost:5000 or a configured API URL.
      // But let's check if the backend has its own URL or if we can use localhost:5000.
    }
  }
  return 'http://localhost:5000/api';
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
