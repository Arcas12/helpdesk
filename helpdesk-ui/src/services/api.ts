import axios from 'axios';
import {
  LoginRequest, LoginResponse, ApiResponse,
  Ticket, CreateTicketRequest, UpdateTicketRequest,
  PagedResult, TicketFilter, Comment,
  User, CreateUserRequest, UpdateUserRequest,
  DashboardData, Category
} from '../types';

// ══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE AXIOS
// Creamos una instancia con la URL base de la API.
// Así no repetimos la URL en cada llamada.
// ══════════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: 'http://localhost:5175/api',
  headers: { 'Content-Type': 'application/json' }
});

// ── Interceptor de REQUEST ────────────────────────────────────
// Antes de CADA petición, agrega automáticamente el token JWT
// en el header Authorization. Así no tienes que hacerlo manual.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de RESPONSE ───────────────────────────────────
// Si la API devuelve 401 (token expirado o inválido),
// limpiamos el localStorage y redirigimos al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════
// SERVICIO DE AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════
export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data.data;
  }
};

// ══════════════════════════════════════════════════════════════
// SERVICIO DE TICKETS
// ══════════════════════════════════════════════════════════════
export const ticketService = {
  getAll: async (filter: TicketFilter = {}): Promise<PagedResult<Ticket>> => {
    const response = await api.get<ApiResponse<PagedResult<Ticket>>>('/tickets', {
      params: filter
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTicketRequest): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>('/tickets', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateTicketRequest): Promise<Ticket> => {
    const response = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, data);
    return response.data.data;
  },

  getComments: async (id: number): Promise<Comment[]> => {
    const response = await api.get<ApiResponse<Comment[]>>(`/tickets/${id}/comments`);
    return response.data.data;
  },

  addComment: async (id: number, content: string): Promise<Comment> => {
    const response = await api.post<ApiResponse<Comment>>(
      `/tickets/${id}/comments`,
      { content }
    );
    return response.data.data;
  }
};

// ══════════════════════════════════════════════════════════════
// SERVICIO DE USUARIOS (solo Admin)
// ══════════════════════════════════════════════════════════════
export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  // Devuelve solo los usuarios con rol "Agent" y activos
  getAgents: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data.filter(u => u.role === 'Agent' && u.isActive);
  },
};

// ══════════════════════════════════════════════════════════════
// SERVICIO DE DASHBOARD
// ══════════════════════════════════════════════════════════════
export const dashboardService = {
  get: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data.data;
  }
};

// ══════════════════════════════════════════════════════════════
// SERVICIO DE CATEGORÍAS
// ══════════════════════════════════════════════════════════════
export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  }
};

export default api;