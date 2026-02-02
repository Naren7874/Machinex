import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==========================================
// AUTH STORE
// ==========================================

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
    isVerified: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
                localStorage.setItem('token', token);
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }));
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// ==========================================
// UI STORE
// ==========================================

interface UIState {
    isSidebarOpen: boolean;
    isLoading: boolean;
    modalType: string | null;
    modalData: unknown;
    toggleSidebar: () => void;
    setLoading: (loading: boolean) => void;
    openModal: (type: string, data?: unknown) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: false,
    isLoading: false,
    modalType: null,
    modalData: null,

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setLoading: (loading) => set({ isLoading: loading }),
    openModal: (type, data = null) => set({ modalType: type, modalData: data }),
    closeModal: () => set({ modalType: null, modalData: null }),
}));

// ==========================================
// FILTER STORE
// ==========================================

interface FilterState {
    category: string;
    state: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    condition: string;
    search: string;
    sort: string;
    setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'resetFilters'>, value: string) => void;
    resetFilters: () => void;
}

const initialFilters = {
    category: '',
    state: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    search: '',
    sort: '-createdAt',
};

export const useFilterStore = create<FilterState>((set) => ({
    ...initialFilters,

    setFilter: (key, value) => set({ [key]: value }),
    resetFilters: () => set(initialFilters),
}));
