import axios, { type AxiosInstance, type AxiosError } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - adds auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handles errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==========================================
// AUTH SERVICES
// ==========================================

export const authService = {
    register: async (data: { name: string; email: string; password: string; phone: string }) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    login: async (data: { email: string; password: string }) => {
        const response = await api.post('/auth/login', data);
        if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateProfile: async (data: { name?: string; phone?: string; location?: object }) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await api.put('/auth/change-password', data);
        return response.data;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};

// ==========================================
// MACHINERY SERVICES
// ==========================================

export interface MachineryFilters {
    category?: string;
    state?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    brand?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface MachineryData {
    title: string;
    description: string;
    category: string;
    brand: string;
    model: string;
    year: number;
    condition: string;
    price: number;
    negotiable?: boolean;
    images: string[];
    location: {
        state: string;
        city: string;
        pincode: string;
    };
    specifications?: {
        engineHours?: number;
        horsePower?: number;
        fuelType?: string;
    };
}

export const machineryService = {
    getAll: async (filters: MachineryFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/machinery?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/machinery/${id}`);
        return response.data;
    },

    create: async (data: MachineryData) => {
        const response = await api.post('/machinery', data);
        return response.data;
    },

    update: async (id: string, data: Partial<MachineryData>) => {
        const response = await api.put(`/machinery/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/machinery/${id}`);
        return response.data;
    },

    getMyListings: async (params: { status?: string; page?: number; limit?: number } = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                queryParams.append(key, String(value));
            }
        });
        const response = await api.get(`/machinery/my-listings?${queryParams.toString()}`);
        return response.data;
    },
};

// ==========================================
// HEALTH CHECK
// ==========================================

export const healthService = {
    check: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};

export default api;
