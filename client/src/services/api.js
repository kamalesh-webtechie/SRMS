import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Extract the server root for media URLs (remove /api from the end)
const SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes for large bulk uploads
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get full URL for media files (profile photos, attachments)
export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // Add leading slash if missing
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${normalizedPath}`;
};

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
