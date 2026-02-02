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
// AUTH SERVICES (OTP-based flow)
// ==========================================

export const authService = {
    /**
     * Register a new user (sends OTP, no token)
     */
    register: async (data: { name: string; phone: string; email?: string }) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    /**
     * Request OTP for login
     */
    login: async (data: { phone: string }) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    /**
     * Send OTP to phone number
     */
    sendOtp: async (data: { phone: string }) => {
        const response = await api.post('/auth/send-otp', data);
        return response.data;
    },

    /**
     * Verify OTP and get token
     */
    verifyOtp: async (data: { phone: string; verificationCode: string }) => {
        const response = await api.post('/auth/verify-otp', data);
        if (response.data.data?.token) {
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

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};

// ==========================================
// LISTING SERVICES
// ==========================================

export interface ListingFilters {
    category?: string;
    machineType?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    brand?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface ListingData {
    title: string;
    description: string;
    category: string;
    machineType: string;
    brand?: string;
    modelName?: string;
    year?: number;
    condition: string;
    price: number;
    isNegotiable?: boolean;
    images?: Array<{
        url: string;
        cloudinaryId: string;
        isFeatured?: boolean;
    }>;
    location: string;
    specifications?: Record<string, unknown>;
}

export const listingService = {
    getAll: async (filters: ListingFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/listings?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    },

    create: async (data: ListingData) => {
        const response = await api.post('/listings', data);
        return response.data;
    },

    update: async (id: string, data: Partial<ListingData>) => {
        const response = await api.put(`/listings/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/listings/${id}`);
        return response.data;
    },

    getMyListings: async (params: { status?: string; page?: number; limit?: number } = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                queryParams.append(key, String(value));
            }
        });
        const response = await api.get(`/listings/my-listings?${queryParams.toString()}`);
        return response.data;
    },

    sendInquiry: async (id: string) => {
        const response = await api.post(`/listings/${id}/inquiry`);
        return response.data;
    },

    trackWhatsAppClick: async (id: string) => {
        const response = await api.post(`/listings/${id}/whatsapp-click`);
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
