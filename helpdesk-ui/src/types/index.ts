// ══════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT
// Definen la forma de los datos que vienen de la API.
// TypeScript nos avisa en tiempo de desarrollo si usamos
// un campo que no existe o del tipo incorrecto.
// ══════════════════════════════════════════════════════════════

// ── Autenticación ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
}

// ── Usuario autenticado (guardado en contexto) ─────────────────
export interface AuthUser {
  token: string;
  fullName: string;
  email: string;
  role: 'Administrator' | 'Agent' | 'Requester';
}

// ── Usuarios ──────────────────────────────────────────────────
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  fullName: string;
  roleId: number;
  isActive: boolean;
}

// ── Tickets ───────────────────────────────────────────────────
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus   = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: number; // 0=Low, 1=Medium, 2=High, 3=Critical
  categoryId: number;
}

export interface UpdateTicketRequest {
  status: number;
  priority: number;
  categoryId: number;
  assignedToId?: number;
}

// ── Comentarios ───────────────────────────────────────────────
export interface Comment {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

// ── Paginación ────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Filtros de tickets ────────────────────────────────────────
export interface TicketFilter {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  categoryId?: number;
  agentId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ── Dashboard ─────────────────────────────────────────────────
export interface ChartItem {
  label: string;
  value: number;
}

export interface DashboardData {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  byPriority: ChartItem[];
  byCategory: ChartItem[];
  byAgent: ChartItem[];
}

// ── Categorías ────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

// ── Respuesta genérica de la API ──────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}