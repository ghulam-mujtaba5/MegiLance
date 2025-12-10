// @AI-HINT: Comprehensive API client for MegiLance backend integration
// Provides type-safe methods for all backend endpoints with proper error handling

// In production on DO App Platform: /api routes directly to backend
// In local dev: /api is proxied via next.config.js rewrites
const API_BASE_URL = '/api';

// Token storage keys - use constants to prevent typos
const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Auth token management with secure storage
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        // Use sessionStorage for access tokens (more secure)
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        // Also set cookie for middleware authentication
        // Cookie expires in 7 days to match refresh token lifetime
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `auth_token=${token}; path=/; SameSite=Lax; Max-Age=${maxAge}`;
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        // Clear cookie
        document.cookie = 'auth_token=; path=/; Max-Age=0; SameSite=Lax';
      }
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    try {
      // Try sessionStorage first (access token), then localStorage (legacy)
      authToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
  return authToken;
}

export function setRefreshToken(token: string | null) {
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
  return null;
}

// Clear all authentication data
export function clearAuthData() {
  authToken = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      // Clear legacy and other auth keys
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('portal_area');
      // Clear cookie
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
}

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Generic fetch wrapper with auth, timeout, and security headers
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    // Security: Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
      signal: controller.signal,
      // Include credentials for CORS requests (cookies, auth headers)
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new APIError(
        error.detail || `HTTP ${response.status}`,
        response.status,
        error.error_type,
        error
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', 408);
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// ===========================
// AUTHENTICATION
// ===========================

// Type definitions for auth responses
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  requires_2fa?: boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

interface RefreshResponse {
  access_token: string;
}

interface TwoFactorStatus {
  enabled: boolean;
}

interface TwoFactorEnableResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return data;
  },

  register: async (userData: { email: string; password: string; name: string; role: string }): Promise<AuthUser> => {
    return apiFetch<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    clearAuthData();
  },

  refreshToken: async (): Promise<RefreshResponse> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new APIError('No refresh token available', 401);
    }
    const data = await apiFetch<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  me: (): Promise<AuthUser> => apiFetch<AuthUser>('/auth/me'),

  updateProfile: (data: Partial<AuthUser>): Promise<AuthUser> => apiFetch<AuthUser>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  changePassword: (currentPassword: string, newPassword: string): Promise<{ message: string }> =>
    apiFetch<{ message: string }>('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  get2FAStatus: (): Promise<TwoFactorStatus> => apiFetch<TwoFactorStatus>('/auth/2fa/status'),

  enable2FA: (): Promise<TwoFactorEnableResponse> => apiFetch<TwoFactorEnableResponse>('/auth/2fa/enable', { method: 'POST' }),

  verify2FA: (code: string) => apiFetch('/auth/2fa/verify', { 
    method: 'POST', 
    body: JSON.stringify({ code }) 
  }),

  verify2FALogin: (code: string, tempToken: string) => apiFetch<{ access_token: string }>('/auth/2fa/verify-login', {
    method: 'POST',
    body: JSON.stringify({ code, temp_token: tempToken }),
  }),

  verifyEmail: (token: string) => apiFetch(`/auth/verify-email?token=${token}`),

  disable2FA: () => apiFetch('/auth/2fa/disable', { method: 'POST' }),
};

// ===========================
// SOCIAL AUTH
// ===========================
export const socialAuthApi = {
  getProviders: () => apiFetch('/social-auth/providers'),
  
  start: (provider: string, redirectUri: string, portalArea?: string) => 
    apiFetch('/social-auth/start', {
      method: 'POST',
      body: JSON.stringify({ 
        provider, 
        redirect_uri: redirectUri,
        ...(portalArea ? { portal_area: portalArea } : {}),
      }),
    }),
    
  complete: (code: string, state: string) =>
    apiFetch('/social-auth/complete', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),
    
  getLinkedAccounts: () => apiFetch('/social-auth/linked-accounts'),
  
  unlinkAccount: (provider: string) => 
    apiFetch(`/social-auth/linked-accounts/${provider}`, { method: 'DELETE' }),
    
  syncProfile: (provider: string, fields?: string[]) =>
    apiFetch('/social-auth/sync-profile', {
      method: 'POST',
      body: JSON.stringify({ provider, fields }),
    }),
};

// ===========================
// TIME TRACKING
// ===========================
export const timeEntriesApi = {
  start: (contractId: number, description: string, billable = true, hourlyRate?: number) =>
    apiFetch('/time-entries/', {
      method: 'POST',
      body: JSON.stringify({ contract_id: contractId, description, billable, hourly_rate: hourlyRate }),
    }),

  stop: (entryId: number) =>
    apiFetch(`/time-entries/${entryId}/stop`, { method: 'POST' }),

  list: (contractId?: number, page = 1, pageSize = 20) =>
    apiFetch(`/time-entries/?${new URLSearchParams({ 
      ...(contractId && { contract_id: contractId.toString() }), 
      page: page.toString(), 
      page_size: pageSize.toString() 
    })}`),

  get: (entryId: number) =>
    apiFetch(`/time-entries/${entryId}`),

  update: (entryId: number, data: { description?: string; billable?: boolean }) =>
    apiFetch(`/time-entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (entryId: number) =>
    apiFetch(`/time-entries/${entryId}`, { method: 'DELETE' }),

  getSummary: (contractId: number) =>
    apiFetch(`/time-entries/summary?contract_id=${contractId}`),

  approve: (entryId: number) =>
    apiFetch(`/time-entries/${entryId}/approve`, { method: 'POST' }),

  reject: (entryId: number, reason: string) =>
    apiFetch(`/time-entries/${entryId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ===========================
// INVOICES
// ===========================
export const invoicesApi = {
  create: (data: any) =>
    apiFetch('/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (filters?: { status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/invoices/?${params}`);
  },

  get: (invoiceId: number) =>
    apiFetch(`/invoices/${invoiceId}`),

  update: (invoiceId: number, data: { due_date?: string; notes?: string; status?: string }) =>
    apiFetch(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (invoiceId: number) =>
    apiFetch(`/invoices/${invoiceId}`, { method: 'DELETE' }),

  markAsPaid: (invoiceId: number, paymentId: number) =>
    apiFetch(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId }),
    }),

  send: (invoiceId: number) =>
    apiFetch(`/invoices/${invoiceId}/send`, { method: 'POST' }),
};

// ===========================
// ESCROW
// ===========================
export const escrowApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch(`/escrow/?page=${page}&page_size=${pageSize}`),

  get: (escrowId: number) =>
    apiFetch(`/escrow/${escrowId}`),

  fund: (data: { contract_id: number; amount: number; description?: string }) =>
    apiFetch('/escrow/fund', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  release: (escrowId: number, data: { amount: number; notes?: string }) =>
    apiFetch(`/escrow/${escrowId}/release`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refund: (escrowId: number, data: { amount?: number; reason: string }) =>
    apiFetch(`/escrow/${escrowId}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBalance: () =>
    apiFetch('/escrow/balance'),
};

// ===========================
// CATEGORIES
// ===========================
export const categoriesApi = {
  list: () => apiFetch('/categories/'),
  
  getTree: () => apiFetch('/categories/tree'),
  
  getBySlug: (slug: string) => apiFetch(`/categories/${slug}`),
};

// ===========================
// TAGS
// ===========================
export const tagsApi = {
  list: (filters?: { type?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/tags/?${params}`);
  },

  create: (data: { name: string; type: 'skill' | 'priority' | 'location' | 'budget' | 'general' }) =>
    apiFetch('/tags/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (tagId: number) => apiFetch(`/tags/${tagId}`),

  update: (tagId: number, data: { name?: string; type?: string }) =>
    apiFetch(`/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (tagId: number) =>
    apiFetch(`/tags/${tagId}`, { method: 'DELETE' }),

  getPopular: () =>
    apiFetch('/tags/popular'),

  getProjectTags: (projectId: number) =>
    apiFetch(`/tags/projects/${projectId}/tags`),

  addToProject: (projectId: number, tagId: number) =>
    apiFetch(`/tags/projects/${projectId}/tags/${tagId}`, { method: 'POST' }),

  removeFromProject: (projectId: number, tagId: number) =>
    apiFetch(`/tags/projects/${projectId}/tags/${tagId}`, { method: 'DELETE' }),
};

// ===========================
// FAVORITES
// ===========================
export const favoritesApi = {
  list: (targetType?: 'project' | 'freelancer' | 'client', page = 1, pageSize = 20) =>
    apiFetch(`/favorites/?${new URLSearchParams({ 
      ...(targetType && { target_type: targetType }), 
      page: page.toString(), 
      page_size: pageSize.toString() 
    })}`),

  create: (targetType: 'project' | 'freelancer' | 'client', targetId: number) =>
    apiFetch('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    }),

  delete: (favoriteId: number) =>
    apiFetch(`/favorites/${favoriteId}`, { method: 'DELETE' }),

  check: (targetType: string, targetId: number) =>
    apiFetch(`/favorites/check/${targetType}/${targetId}`),
};

// ===========================
// SUPPORT TICKETS
// ===========================
export const supportTicketsApi = {
  list: (filters?: { status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/support-tickets/?${params}`);
  },

  create: (data: any) =>
    apiFetch('/support-tickets/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  get: (ticketId: number) =>
    apiFetch(`/support-tickets/${ticketId}`),

  update: (ticketId: number, status: 'open' | 'in_progress' | 'resolved' | 'closed') =>
    apiFetch(`/support-tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  addMessage: (ticketId: number, data: { message: string }) =>
    apiFetch(`/support-tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===========================
// REFUNDS
// ===========================
export const refundsApi = {
  list: (filter?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (filter) params.append('status', filter);
    return apiFetch(`/refunds/?${params}`);
  },

  request: (data: any) =>
    apiFetch('/refunds/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  get: (refundId: number) =>
    apiFetch(`/refunds/${refundId}`),

  approve: (refundId: number, data?: { admin_notes?: string }) =>
    apiFetch(`/refunds/${refundId}/approve`, { 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  reject: (refundId: number, reason: string) =>
    apiFetch(`/refunds/${refundId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ===========================
// SEARCH
// ===========================
export const searchApi = {
  projects: (query: string, filters?: {
    budget_min?: number;
    budget_max?: number;
    category?: string;
    skills?: string[];
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      const { page = 1, page_size = 20, ...rest } = filters;
      
      // Map pagination to backend params (limit/offset)
      params.append('limit', page_size.toString());
      params.append('offset', ((page - 1) * page_size).toString());

      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiFetch(`/search/projects?${params}`);
  },

  freelancers: (query: string, filters?: {
    skills?: string[];
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiFetch(`/search/freelancers?${params}`);
  },

  global: (query: string) =>
    apiFetch(`/search/?q=${encodeURIComponent(query)}`),

  autocomplete: (query: string) =>
    apiFetch(`/search/autocomplete?q=${encodeURIComponent(query)}`),

  suggestions: (query: string) =>
    apiFetch(`/search/suggestions?q=${encodeURIComponent(query)}`),

  getTrending: (type: 'projects' | 'freelancers' = 'projects', limit = 10) =>
    apiFetch(`/search/trending?type=${type}&limit=${limit}`),
};

// ===========================
// PROJECTS
// ===========================
export const projectsApi = {
  list: (filters?: { status?: string; category?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      const { page = 1, page_size = 20, ...rest } = filters;
      
      // Map pagination to backend params (limit/skip)
      params.append('limit', page_size.toString());
      params.append('skip', ((page - 1) * page_size).toString());

      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/projects?${params}`);
  },

  create: (data: any) =>
    apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (projectId: number) =>
    apiFetch(`/projects/${projectId}`),

  getMyProjects: () =>
    apiFetch('/projects/my-projects'),

  update: (projectId: number, data: any) =>
    apiFetch(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (projectId: number) =>
    apiFetch(`/projects/${projectId}`, { method: 'DELETE' }),
};

// ===========================
// CONTRACTS
// ===========================
export const contractsApi = {
  list: (filters?: { status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/contracts/?${params}`);
  },

  create: (data: any) =>
    apiFetch('/contracts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (contractId: number) =>
    apiFetch(`/contracts/${contractId}`),

  update: (contractId: number, data: any) =>
    apiFetch(`/contracts/${contractId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  accept: (contractId: number) =>
    apiFetch(`/contracts/${contractId}/accept`, { method: 'POST' }),

  complete: (contractId: number) =>
    apiFetch(`/contracts/${contractId}/complete`, { method: 'POST' }),

  createDirect: (data: {
    freelancer_id: number;
    title: string;
    description: string;
    rate_type: string;
    rate: number;
    start_date?: string;
  }) =>
    apiFetch('/contracts/direct', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===========================
// PROPOSALS
// ===========================
export const proposalsApi = {
  list: (filters?: { project_id?: number; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/proposals/?${params}`);
  },

  getDrafts: (projectId?: number) => {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiFetch(`/proposals/drafts${params}`);
  },

  getByProject: (projectId: number) =>
    apiFetch(`/proposals/project/${projectId}`),

  create: (data: {
    project_id: number;
    cover_letter: string;
    bid_amount?: number;
    estimated_hours?: number;
    hourly_rate?: number;
    availability?: string;
    attachments?: string;
  }) =>
    apiFetch('/proposals/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveDraft: (data: {
    project_id: number;
    cover_letter?: string;
    bid_amount?: number;
    estimated_hours?: number;
    hourly_rate?: number;
    availability?: string;
  }) =>
    apiFetch('/proposals/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitDraft: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}/submit`, { method: 'POST' }),

  get: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}`),

  update: (proposalId: number, data: any) =>
    apiFetch(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  accept: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}/accept`, { method: 'POST' }),

  reject: (proposalId: number, reason?: string) =>
    apiFetch(`/proposals/${proposalId}/reject`, {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  withdraw: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}/withdraw`, { method: 'POST' }),

  delete: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}`, { method: 'DELETE' }),
};

// ===========================
// MILESTONES
// ===========================
export const milestonesApi = {
  create: (data: any) =>
    apiFetch('/milestones/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  list: (projectId: string) => apiFetch(`/milestones/?project_id=${projectId}`),
  
  get: (id: string) => apiFetch(`/milestones/${id}`),
  
  update: (id: string, data: any) => 
    apiFetch(`/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id: string) => 
    apiFetch(`/milestones/${id}`, { method: 'DELETE' }),

  submit: (id: number, data: { deliverables: string; submission_notes?: string }) =>
    apiFetch(`/milestones/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: number, data: { approval_notes?: string }) =>
    apiFetch(`/milestones/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reject: (id: number, reason: string) =>
    apiFetch(`/milestones/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_notes: reason }),
    }),
};

// ===========================
// MESSAGES
// ===========================
export const messagesApi = {
  createConversation: (data: any) =>
    apiFetch('/conversations', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  getConversations: (filters?: { status?: string; archived?: boolean; skip?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/conversations?${params}`);
  },

  getConversation: (conversationId: number) =>
    apiFetch(`/conversations/${conversationId}`),

  updateConversation: (conversationId: number, data: { status?: string; is_archived?: boolean }) =>
    apiFetch(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  sendMessage: (data: { conversation_id?: number; receiver_id?: number; project_id?: number; content: string; message_type?: string }) =>
    apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMessages: (conversationId: number, skip = 0, limit = 50) =>
    apiFetch(`/messages?conversation_id=${conversationId}&skip=${skip}&limit=${limit}`),

  getMessage: (messageId: number) =>
    apiFetch(`/messages/${messageId}`),

  updateMessage: (messageId: number, data: { content?: string; is_read?: boolean }) =>
    apiFetch(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteMessage: (messageId: number) =>
    apiFetch(`/messages/${messageId}`, { method: 'DELETE' }),

  getUnreadCount: () =>
    apiFetch('/messages/unread/count'),
};

// ===========================
// NOTIFICATIONS
// ===========================
export const notificationsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch(`/notifications/?page=${page}&page_size=${pageSize}`),

  markAsRead: (notificationId: number) =>
    apiFetch(`/notifications/${notificationId}/read`, { method: 'POST' }),

  markAllAsRead: () =>
    apiFetch('/notifications/read-all', { method: 'POST' }),

  delete: (notificationId: number) =>
    apiFetch(`/notifications/${notificationId}`, { method: 'DELETE' }),
};

// ===========================
// PAYMENTS
// ===========================
export const paymentsApi = {
  list: (limit = 50, skip = 0) =>
    apiFetch(`/payments/?limit=${limit}&skip=${skip}`),
    
  get: (paymentId: number) =>
    apiFetch(`/payments/${paymentId}`),

  addFunds: (data: any) =>
    apiFetch('/payments/add-funds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  withdraw: (data: any) =>
    apiFetch('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createIntent: (data: any) =>
    apiFetch('/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===========================
// PAYMENT METHODS
// ===========================
export const paymentMethodsApi = {
  list: () => apiFetch('/payment-methods'),
};


// ===========================
// REVIEWS
// ===========================
export const reviewsApi = {
  list: (filters?: { 
    user_id?: number; 
    reviewer_id?: number; 
    contract_id?: number; 
    min_rating?: number; 
    is_public?: boolean; 
    page?: number; 
    page_size?: number 
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/reviews/?${params}`);
  },

  create: (data: any) =>
    apiFetch('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}`),
    
  getStats: (userId: number) =>
    apiFetch(`/reviews/stats/${userId}`),

  delete: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}`, { method: 'DELETE' }),
};

// ===========================
// JOB ALERTS
// ===========================
export const jobAlertsApi = {
  getAll: () => apiFetch<any[]>('/job-alerts/'),

  create: (data: { keywords: string; frequency: string; is_ai_powered?: boolean }) =>
    apiFetch<any>('/job-alerts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { keywords?: string; frequency?: string; is_ai_powered?: boolean }) =>
    apiFetch<any>(`/job-alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch(`/job-alerts/${id}`, { method: 'DELETE' }),
};

// ===========================
// PORTAL
// ===========================
export const portalApi = {
  client: {
    getDashboardStats: () => apiFetch('/portal/client/dashboard/stats'),
    getProjects: (filters?: { status?: string; skip?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/client/projects?${params}`);
    },
    createProject: (data: any) => 
      apiFetch('/portal/client/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getProposals: (filters?: { project_id?: number; skip?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/client/proposals?${params}`);
    },
    getPayments: (skip = 0, limit = 50) => 
      apiFetch(`/portal/client/payments?skip=${skip}&limit=${limit}`),
    getMonthlySpending: (months = 6) => apiFetch<{spending: {name: string; spending: number}[]}>(`/portal/client/spending/monthly?months=${months}`),
    getWallet: () => apiFetch('/portal/client/wallet'),
  },
  freelancer: {
    getDashboardStats: () => apiFetch('/portal/freelancer/dashboard/stats'),
    getJobs: (filters?: { category?: string; skip?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/freelancer/jobs?${params}`);
    },
    getProjects: (filters?: { status?: string; skip?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/freelancer/projects?${params}`);
    },
    getProposals: (filters?: { status?: string; skip?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      // Use the general proposals endpoint which handles freelancer context
      return apiFetch(`/proposals/?${params}`);
    },
    submitProposal: (data: {
      project_id: number;
      cover_letter: string;
      bid_amount: number;
      delivery_time: number;
    }) => {
      const params = new URLSearchParams({
        project_id: data.project_id.toString(),
        cover_letter: data.cover_letter,
        bid_amount: data.bid_amount.toString(),
        delivery_time: data.delivery_time.toString()
      });
      return apiFetch(`/portal/freelancer/proposals?${params}`, {
        method: 'POST',
      });
    },
    getPortfolio: () => apiFetch('/portal/freelancer/portfolio'),
    getSkills: () => apiFetch('/portal/freelancer/skills'),
    getEarnings: () => apiFetch('/portal/freelancer/earnings'),
    getMonthlyEarnings: (months = 6) => apiFetch<{earnings: {month: string; amount: number}[]}>(`/portal/freelancer/earnings/monthly?months=${months}`),
    getWallet: () => apiFetch('/portal/freelancer/wallet'),
    getPayments: (skip = 0, limit = 50) => 
      apiFetch(`/portal/freelancer/payments?skip=${skip}&limit=${limit}`),
    withdraw: (amount: number) => 
      apiFetch(`/portal/freelancer/withdraw?amount=${amount}`, { method: 'POST' }),
  }
};

// ===========================
// USERS
// ===========================
export const usersApi = {
  completeOnboarding: (data: any) =>
    apiFetch('/users/onboarding-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  search: (query: string, type: string) =>
    apiFetch(`/users/search?q=${query}&type=${type}`),

  getClients: () =>
    apiFetch('/users/clients'),

  getNotificationPreferences: () =>
    apiFetch('/users/me/notification-preferences'),

  updateNotificationPreferences: (data: any) =>
    apiFetch('/users/me/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  get: (userId: string | number) =>
    apiFetch(`/users/${userId}`),

  completeProfile: (data: any) =>
    apiFetch('/users/me/complete-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ===========================
// ADMIN
// ===========================
export const adminApi = {
  getDashboardStats: () => apiFetch('/admin/dashboard/stats'),
  getUserActivity: () => apiFetch('/admin/dashboard/user-activity'),
  getProjectMetrics: () => apiFetch('/admin/dashboard/project-metrics'),
  getFinancialMetrics: () => apiFetch('/admin/dashboard/financial-metrics'),
  getTopFreelancers: (limit = 10) => apiFetch(`/admin/dashboard/top-freelancers?limit=${limit}`),
  getTopClients: (limit = 10) => apiFetch(`/admin/dashboard/top-clients?limit=${limit}`),
  getRecentActivity: (limit = 20) => apiFetch(`/admin/dashboard/recent-activity?limit=${limit}`),
  
  getUsers: (filters?: { role?: string; search?: string; skip?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/admin/users?${params}`);
  },
  
  toggleUserStatus: (userId: number) => 
    apiFetch(`/admin/users/${userId}/toggle-status`, { method: 'POST' }),
    
  getProjects: (filters?: { status?: string; skip?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/admin/projects?${params}`);
  },
  
  getPayments: (filters?: { status?: string; skip?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/admin/payments?${params}`);
  },
  
  getAnalytics: () => apiFetch('/admin/analytics/overview'),
  getSettings: () => apiFetch('/admin/settings'),
  getPlatformReviewStats: () => apiFetch('/admin/dashboard/reviews'),
  getFraudAlerts: (limit = 10) => apiFetch(`/admin/dashboard/fraud?limit=${limit}`),
};

// ===========================
// CLIENT (Direct)
// ===========================
export const clientApi = {
  getProjects: () => apiFetch<any[]>('/portal/client/projects'),
  getPayments: () => apiFetch<any[]>('/portal/client/payments'),
  getFreelancers: async () => {
    try {
      console.log('[API] Fetching AI recommendations...');
      const response = await apiFetch<{ recommendations: any[] }>('/matching/recommendations?limit=5');
      console.log('[API] AI recommendations response:', response);
      if (!response?.recommendations) {
        console.warn('[API] No recommendations field in response');
        return [];
      }
      return response.recommendations.map((r: any) => ({
        id: r.freelancer_id.toString(),
        name: r.freelancer_name,
        title: r.freelancer_bio ? r.freelancer_bio.substring(0, 30) + '...' : 'Freelancer',
        rating: r.match_factors?.avg_rating ? r.match_factors.avg_rating * 5 : 5.0,
        hourlyRate: r.hourly_rate ? `$${r.hourly_rate}` : '$0',
        skills: [], // The recommendation endpoint might not return skills list directly yet
        completedProjects: 0, // Not in recommendation response
        avatarUrl: r.profile_image_url,
        location: r.location,
        matchScore: r.match_score // Add this for UI to show match %
      }));
    } catch (error) {
      console.error('[API] Failed to fetch AI recommendations:', error);
      // Return empty array on failure - no mock fallback for launch
      return [];
    }
  },
  getReviews: async () => {
    try {
      const response = await apiFetch<{ reviews: any[] }>('/reviews/?page_size=10');
      const reviews = response.reviews || response;
      return Array.isArray(reviews) ? reviews.map((r: any) => ({
        id: String(r.id),
        projectTitle: r.project_title || 'Project',
        freelancerName: r.reviewee_name || 'Freelancer',
        rating: r.rating || 5,
        comment: r.comment || '',
        date: r.created_at || new Date().toISOString()
      })) : [];
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }
  },
  createJob: (data: any) => apiFetch('/portal/client/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ===========================
// SKILLS
// ===========================
export const skillsApi = {
  getQuestions: (skillId: string, level: string) => apiFetch(`/skills/${skillId}/questions?level=${level}`),
  submitAssessment: (data: any) => apiFetch('/skills/assessments', { method: 'POST', body: JSON.stringify(data) }),
};

// ===========================
// PORTFOLIO
// ===========================
export const portfolioApi = {
  createItem: (data: any) =>
    apiFetch('/portfolio/items', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  list: (userId?: string | number) =>
    apiFetch(`/portfolio${userId ? `?user_id=${userId}` : ''}`),

  get: (id: number) => apiFetch(`/portfolio/${id}`),

  update: (id: number, data: any) =>
    apiFetch(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch(`/portfolio/${id}`, { method: 'DELETE' }),
};

// ===========================
// PAYOUT METHODS
// ===========================
export const payoutMethodsApi = {
  create: (data: any) =>
    apiFetch('/payout-methods/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  list: () => apiFetch('/payout-methods/'),
  
  get: (id: string) => apiFetch(`/payout-methods/${id}`),
  
  update: (id: string, data: any) => 
    apiFetch(`/payout-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id: string) => 
    apiFetch(`/payout-methods/${id}`, { method: 'DELETE' }),
};

// ===========================
// DISPUTES
// ===========================
export const disputesApi = {
  create: (data: any) =>
    apiFetch('/disputes/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  list: (filters?: { status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/disputes/?${params}`);
  },

  get: (disputeId: number) =>
    apiFetch(`/disputes/${disputeId}`),

  update: (disputeId: number, data: any) =>
    apiFetch(`/disputes/${disputeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  assign: (disputeId: number, adminId: number) =>
    apiFetch(`/disputes/${disputeId}/assign?admin_id=${adminId}`, {
      method: 'POST',
    }),

  resolve: (disputeId: number, resolution: string, contractStatus?: string) => {
    const params = new URLSearchParams();
    params.append('resolution', resolution);
    if (contractStatus) {
      params.append('contract_status', contractStatus);
    }
    return apiFetch(`/disputes/${disputeId}/resolve?${params}`, {
      method: 'POST',
    });
  },

  uploadEvidence: (disputeId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: formData,
    });
  },
};

// ===========================
// SAVED SEARCHES
// ===========================
export const searchesApi = {
  getSaved: () => apiFetch('/searches/saved'),

  save: (data: any) =>
    apiFetch('/searches/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch(`/searches/${id}`, { method: 'DELETE' }),
};

// ===========================
// UPLOADS
// ===========================
export const uploadsApi = {
  upload: (type: 'avatar' | 'portfolio' | 'document', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ url: string }>(`/uploads/${type}`, {
      method: 'POST',
      body: formData,
    });
  },
};

// ===========================
// AI
// ===========================
export const aiApi = {
  checkFraud: (userId: number) =>
    apiFetch<{
      user_id: number;
      risk_score: number;
      risk_level: string;
      risk_factors: string[];
      recommendation: string;
    }>(`/fraud-detection/analyze/user/${userId}`),

  estimatePrice: (data: {
    category: string;
    skills_required: string[];
    description?: string;
    estimated_hours?: number;
    complexity?: string;
  }) =>
    apiFetch<{
      estimated_hourly_rate: number;
      estimated_total: number;
      estimated_hours: number;
      low_estimate: number;
      high_estimate: number;
      complexity: string;
      category: string;
      confidence: number;
      factors: string[];
    }>('/ai/estimate-price', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  estimateFreelancerRate: (freelancerId: number, data?: {
    years_experience?: number;
    skills?: string[];
    completed_projects?: number;
    average_rating?: number;
  }) => {
    const params = new URLSearchParams();
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiFetch<{
      freelancer_id: number;
      current_rate: number | null;
      estimated_rate: number;
      low_estimate: number;
      high_estimate: number;
      factors: any;
      confidence: number;
    }>(`/ai/estimate-freelancer-rate/${freelancerId}?${params}`);
  },
};

// ===========================
// ANALYTICS
// ===========================
export const analyticsApi = {
  getDashboardSummary: () => apiFetch('/analytics/dashboard/summary'),
  
  getRegistrationTrends: (startDate: string, endDate: string, interval: 'day' | 'week' | 'month' = 'day') => 
    apiFetch(`/analytics/users/registration-trends?start_date=${startDate}&end_date=${endDate}&interval=${interval}`),
    
  getRevenueTrends: (startDate: string, endDate: string, interval: 'day' | 'week' | 'month' = 'day') => 
    apiFetch(`/analytics/revenue/trends?start_date=${startDate}&end_date=${endDate}&interval=${interval}`),
    
  getActiveUserStats: (days: number = 30) => 
    apiFetch(`/analytics/users/active-stats?days=${days}`),
    
  getCompletionRate: () => 
    apiFetch('/analytics/projects/completion-rate'),

  getUserDistribution: () => 
    apiFetch('/analytics/users/location-distribution'),
};

// ===========================
// REFERRAL PROGRAM
// ===========================
export const referralApi = {
  getMyCode: () => apiFetch('/referral-program/my-code'),
  generateCode: () => apiFetch('/referral-program/generate-code', { method: 'POST' }),
  validateCode: (code: string) => apiFetch(`/referral-program/validate/${code}`),
  applyCode: (code: string) => apiFetch(`/referral-program/apply/${code}`, { method: 'POST' }),
  getMyReferrals: (status?: string, skip = 0, limit = 50) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    return apiFetch(`/referral-program/my-referrals?${params}`);
  },
  getStats: () => apiFetch('/referral-program/stats'),
  getRewards: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiFetch(`/referral-program/rewards${params}`);
  },
  withdrawRewards: (amount: number) =>
    apiFetch(`/referral-program/withdraw-rewards?amount=${amount}`, { method: 'POST' }),
  getLeaderboard: (period = 'monthly', limit = 10) =>
    apiFetch(`/referral-program/leaderboard?period=${period}&limit=${limit}`),
  getCampaigns: () => apiFetch('/referral-program/campaigns'),
  sendInvite: (email: string, message?: string) =>
    apiFetch('/referral-program/invite/email', {
      method: 'POST',
      body: JSON.stringify({ email, message }),
    }),
  sendBulkInvites: (emails: string[]) =>
    apiFetch('/referral-program/invite/bulk', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    }),
  getShareLinks: () => apiFetch('/referral-program/share-links'),
  getMilestones: () => apiFetch('/referral-program/milestones'),
};

// ===========================
// CAREER DEVELOPMENT
// ===========================
export const careerApi = {
  getPaths: (category?: string) => {
    const params = category ? `?category=${category}` : '';
    return apiFetch(`/career/paths${params}`);
  },
  getPath: (pathId: string) => apiFetch(`/career/paths/${pathId}`),
  getMyProgress: () => apiFetch('/career/my-progress'),
  createGoal: (data: { title: string; target_skill: string; target_level: string; deadline?: string }) =>
    apiFetch('/career/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGoals: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiFetch(`/career/goals${params}`);
  },
  updateGoal: (goalId: string, data: { progress?: number; status?: string }) =>
    apiFetch(`/career/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGoal: (goalId: string) => apiFetch(`/career/goals/${goalId}`, { method: 'DELETE' }),
  findMentors: (skill?: string, minExperience = 0) => {
    const params = new URLSearchParams({ min_experience: minExperience.toString() });
    if (skill) params.append('skill', skill);
    return apiFetch(`/career/mentors?${params}`);
  },
  requestMentorship: (mentorId: string, message: string, goals: string[]) =>
    apiFetch('/career/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId, message, goals }),
    }),
  getMentorshipRequests: () => apiFetch('/career/mentorship/requests'),
  respondToMentorship: (requestId: string, action: 'accept' | 'reject') =>
    apiFetch(`/career/mentorship/requests/${requestId}?action=${action}`, { method: 'PUT' }),
  getRecommendations: () => apiFetch('/career/recommendations'),
  analyzeSkillGaps: (targetRole: string) =>
    apiFetch(`/career/skill-gap-analysis?target_role=${encodeURIComponent(targetRole)}`),
  startAssessment: (skill: string) =>
    apiFetch('/career/skill-assessment', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    }),
  getCertifications: () => apiFetch('/career/certifications'),
};

// ===========================
// AVAILABILITY CALENDAR
// ===========================
export const availabilityApi = {
  getSchedule: (startDate: string, endDate: string) =>
    apiFetch(`/availability/schedule?start_date=${startDate}&end_date=${endDate}`),
  getWeeklyPattern: () => apiFetch('/availability/weekly-pattern'),
  updateWeeklyPattern: (pattern: any[]) =>
    apiFetch('/availability/weekly-pattern', {
      method: 'PUT',
      body: JSON.stringify(pattern),
    }),
  createBlock: (data: {
    start_datetime: string;
    end_datetime: string;
    status: string;
    title?: string;
    is_recurring?: boolean;
  }) =>
    apiFetch('/availability/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBlocks: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiFetch(`/availability/blocks?${params}`);
  },
  updateBlock: (blockId: string, data: any) =>
    apiFetch(`/availability/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBlock: (blockId: string) => apiFetch(`/availability/blocks/${blockId}`, { method: 'DELETE' }),
  getUserAvailableSlots: (userId: string, date: string, durationMinutes = 60) =>
    apiFetch(`/availability/user/${userId}/available-slots?date=${date}&duration_minutes=${durationMinutes}`),
  createBooking: (data: {
    freelancer_id: string;
    start_datetime: string;
    end_datetime: string;
    title: string;
  }) =>
    apiFetch('/availability/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBookings: (status?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiFetch(`/availability/bookings?${params}`);
  },
  updateBooking: (bookingId: string, data: any) =>
    apiFetch(`/availability/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancelBooking: (bookingId: string) =>
    apiFetch(`/availability/bookings/${bookingId}`, { method: 'DELETE' }),
  getSettings: () => apiFetch('/availability/settings'),
  updateSettings: (settings: any) =>
    apiFetch('/availability/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getSyncStatus: () => apiFetch('/availability/sync-status'),
  syncCalendar: (provider: 'google' | 'outlook' | 'apple') =>
    apiFetch(`/availability/sync/${provider}`, { method: 'POST' }),
};

// ===========================
// RATE CARDS
// ===========================
export const rateCardsApi = {
  getMyCards: () => apiFetch('/rate-cards/my-cards'),
  create: (data: {
    name: string;
    rate_type: string;
    base_rate: number;
    currency?: string;
    description?: string;
  }) =>
    apiFetch('/rate-cards/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (rateCardId: string) => apiFetch(`/rate-cards/${rateCardId}`),
  update: (rateCardId: string, data: any) =>
    apiFetch(`/rate-cards/${rateCardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (rateCardId: string) => apiFetch(`/rate-cards/${rateCardId}`, { method: 'DELETE' }),
  getPackages: (rateCardId: string) => apiFetch(`/rate-cards/${rateCardId}/packages`),
  createPackage: (rateCardId: string, data: {
    name: string;
    description: string;
    price: number;
    deliverables: string[];
    estimated_duration: string;
    revisions?: number;
  }) =>
    apiFetch(`/rate-cards/${rateCardId}/packages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePackage: (packageId: string, data: any) =>
    apiFetch(`/rate-cards/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePackage: (packageId: string) =>
    apiFetch(`/rate-cards/packages/${packageId}`, { method: 'DELETE' }),
  getModifiers: (rateCardId: string) => apiFetch(`/rate-cards/${rateCardId}/modifiers`),
  createModifier: (rateCardId: string, data: any) =>
    apiFetch(`/rate-cards/${rateCardId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUserRateCards: (userId: string) => apiFetch(`/rate-cards/user/${userId}`),
  calculate: (data: { rate_card_id: string; hours?: number; package_id?: string; modifiers?: string[] }) =>
    apiFetch('/rate-cards/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===========================
// PROPOSAL TEMPLATES
// ===========================
export const proposalTemplatesApi = {
  getMyTemplates: (tag?: string, skip = 0, limit = 20) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (tag) params.append('tag', tag);
    return apiFetch(`/proposal-templates/?${params}`);
  },
  create: (data: {
    name: string;
    cover_letter: string;
    description?: string;
    milestones_template?: any[];
    default_rate?: number;
    tags?: string[];
  }) =>
    apiFetch('/proposal-templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (templateId: string) => apiFetch(`/proposal-templates/${templateId}`),
  update: (templateId: string, data: any) =>
    apiFetch(`/proposal-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (templateId: string) => apiFetch(`/proposal-templates/${templateId}`, { method: 'DELETE' }),
  duplicate: (templateId: string, newName?: string) =>
    apiFetch(`/proposal-templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    }),
  browsePublic: (category?: string, search?: string, skip = 0, limit = 20) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return apiFetch(`/proposal-templates/public/browse?${params}`);
  },
  usePublicTemplate: (templateId: string) =>
    apiFetch(`/proposal-templates/public/${templateId}/use`, { method: 'POST' }),
  getVariables: () => apiFetch('/proposal-templates/variables'),
  preview: (templateId: string, variables: Record<string, string>) =>
    apiFetch(`/proposal-templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify(variables),
    }),
  getAnalytics: () => apiFetch('/proposal-templates/analytics'),
  generate: (templateId: string, projectId: string, variables?: Record<string, string>) =>
    apiFetch(`/proposal-templates/${templateId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, variables }),
    }),
};

// ===========================
// AUDIT TRAIL
// ===========================
export const auditTrailApi = {
  getEvents: (filters?: {
    event_type?: string;
    actor_id?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/audit-trail/events?${params}`);
  },
  getEvent: (eventId: string) => apiFetch(`/audit-trail/events/${eventId}`),
  createEvent: (data: {
    event_type: string;
    resource_type: string;
    resource_id: string;
    action: string;
    details?: any;
  }) =>
    apiFetch('/audit-trail/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSummary: (days = 30) => apiFetch(`/audit-trail/summary?days=${days}`),
  getUserActivity: (userId: string, skip = 0, limit = 50) =>
    apiFetch(`/audit-trail/user/${userId}/activity?skip=${skip}&limit=${limit}`),
  getResourceHistory: (resourceType: string, resourceId: string) =>
    apiFetch(`/audit-trail/resource/${resourceType}/${resourceId}/history`),
  exportLogs: (filters: any, format = 'csv') =>
    apiFetch('/audit-trail/export', {
      method: 'POST',
      body: JSON.stringify({ filter: filters, format }),
    }),
  getExportStatus: (exportId: string) => apiFetch(`/audit-trail/export/${exportId}/status`),
  getComplianceReport: (startDate: string, endDate: string) =>
    apiFetch(`/audit-trail/compliance/report?start_date=${startDate}&end_date=${endDate}`),
  getRetentionPolicy: () => apiFetch('/audit-trail/retention/policy'),
  updateRetentionPolicy: (retentionDays: number) =>
    apiFetch(`/audit-trail/retention/policy?retention_days=${retentionDays}`, { method: 'PUT' }),
};

// ===========================
// CUSTOM BRANDING
// ===========================
export const brandingApi = {
  getConfig: (organizationId: string) => apiFetch(`/branding/config/${organizationId}`),
  createConfig: (config: {
    organization_id: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  }) =>
    apiFetch('/branding/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  updateConfig: (organizationId: string, update: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    logo_url?: string;
    custom_css?: string;
  }) =>
    apiFetch(`/branding/config/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    }),
  uploadLogo: (organizationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/branding/config/${organizationId}/logo`, {
      method: 'POST',
      body: formData,
    });
  },
  uploadFavicon: (organizationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/branding/config/${organizationId}/favicon`, {
      method: 'POST',
      body: formData,
    });
  },
  getPresets: () => apiFetch('/branding/presets'),
  applyPreset: (organizationId: string, presetId: string) =>
    apiFetch(`/branding/config/${organizationId}/apply-preset?preset_id=${presetId}`, { method: 'POST' }),
  previewBranding: (organizationId: string) => apiFetch(`/branding/config/${organizationId}/preview`),
  setupCustomDomain: (organizationId: string, domain: string) =>
    apiFetch(`/branding/config/${organizationId}/custom-domain?domain=${encodeURIComponent(domain)}`, { method: 'POST' }),
  checkDomainStatus: (organizationId: string) => apiFetch(`/branding/config/${organizationId}/domain-status`),
  deleteConfig: (organizationId: string) => apiFetch(`/branding/config/${organizationId}`, { method: 'DELETE' }),
};

// ===========================
// COMMUNICATION CENTER
// ===========================
export const communicationApi = {
  sendSMS: (phoneNumber: string, message: string) =>
    apiFetch('/communication/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, message }),
    }),
  sendEmail: (to: string, subject: string, body: string, template?: string) =>
    apiFetch('/communication/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, template }),
    }),
  sendPush: (userId: string, title: string, body: string, data?: any) =>
    apiFetch('/communication/push/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, title, body, data }),
    }),
  getHistory: (channel?: string, skip = 0, limit = 50) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (channel) params.append('channel', channel);
    return apiFetch(`/communication/history?${params}`);
  },
  getPreferences: () => apiFetch('/communication/preferences'),
  updatePreferences: (preferences: any) =>
    apiFetch('/communication/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// ===========================
// METRICS DASHBOARD
// ===========================
export const metricsApi = {
  getRealtime: () => apiFetch('/metrics/realtime'),
  getOverview: (period = '30d') => apiFetch(`/metrics/overview?period=${period}`),
  getRevenue: (startDate: string, endDate: string, interval = 'day') =>
    apiFetch(`/metrics/revenue?start_date=${startDate}&end_date=${endDate}&interval=${interval}`),
  getUsers: (period = '30d') => apiFetch(`/metrics/users?period=${period}`),
  getProjects: (period = '30d') => apiFetch(`/metrics/projects?period=${period}`),
  getConversions: (period = '30d') => apiFetch(`/metrics/conversions?period=${period}`),
  getCustom: (metricId: string, filters?: any) => {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return apiFetch(`/metrics/custom/${metricId}${params}`);
  },
};

// ===========================
// SEARCH ANALYTICS
// ===========================
export const searchAnalyticsApi = {
  getOverview: (period = '30d') => apiFetch(`/search-analytics/overview?period=${period}`),
  getTopQueries: (limit = 20) => apiFetch(`/search-analytics/top-queries?limit=${limit}`),
  getZeroResults: (limit = 20) => apiFetch(`/search-analytics/zero-results?limit=${limit}`),
  getClickThrough: (period = '30d') => apiFetch(`/search-analytics/click-through?period=${period}`),
  getTrends: (query: string, period = '30d') =>
    apiFetch(`/search-analytics/trends?query=${encodeURIComponent(query)}&period=${period}`),
};

// ===========================
// PLATFORM COMPLIANCE
// ===========================
export const complianceApi = {
  getStatus: () => apiFetch('/compliance/status'),
  getGDPRStatus: () => apiFetch('/compliance/gdpr'),
  requestDataExport: () => apiFetch('/compliance/gdpr/export', { method: 'POST' }),
  requestDataDeletion: (reason: string) =>
    apiFetch('/compliance/gdpr/delete', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getConsents: () => apiFetch('/compliance/consents'),
  updateConsent: (consentType: string, granted: boolean) =>
    apiFetch(`/compliance/consents/${consentType}`, {
      method: 'PUT',
      body: JSON.stringify({ granted }),
    }),
  getAuditReport: (reportType: string) => apiFetch(`/compliance/reports/${reportType}`),
};

// ===========================
// TWO-FACTOR AUTH
// ===========================
export const twoFactorApi = {
  getStatus: () => apiFetch('/2fa/status'),
  enable: () => apiFetch('/2fa/enable', { method: 'POST' }),
  verify: (code: string) =>
    apiFetch('/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  disable: () => apiFetch('/2fa/disable', { method: 'POST' }),
  getBackupCodes: () => apiFetch('/2fa/backup-codes'),
  regenerateBackupCodes: () => apiFetch('/2fa/backup-codes/regenerate', { method: 'POST' }),
  verifyBackupCode: (code: string) =>
    apiFetch('/2fa/verify-backup', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

// ===========================
// WEBHOOKS
// ===========================
export const webhooksApi = {
  list: () => apiFetch('/webhooks/'),
  create: (data: { url: string; events: string[]; secret?: string }) =>
    apiFetch('/webhooks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (webhookId: string) => apiFetch(`/webhooks/${webhookId}`),
  update: (webhookId: string, data: any) =>
    apiFetch(`/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (webhookId: string) => apiFetch(`/webhooks/${webhookId}`, { method: 'DELETE' }),
  test: (webhookId: string) => apiFetch(`/webhooks/${webhookId}/test`, { method: 'POST' }),
  getLogs: (webhookId: string) => apiFetch(`/webhooks/${webhookId}/logs`),
  getEvents: () => apiFetch('/webhooks/events'),
};

// ===========================
// API KEYS
// ===========================
export const apiKeysApi = {
  list: () => apiFetch('/api-keys/'),
  create: (data: { name: string; scopes: string[]; expires_at?: string }) =>
    apiFetch('/api-keys/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (keyId: string) => apiFetch(`/api-keys/${keyId}`),
  revoke: (keyId: string) => apiFetch(`/api-keys/${keyId}`, { method: 'DELETE' }),
  getUsage: (keyId: string) => apiFetch(`/api-keys/${keyId}/usage`),
};

// ===========================
// TEAMS
// ===========================
export const teamsApi = {
  list: () => apiFetch('/teams/'),
  create: (data: { name: string; description?: string }) =>
    apiFetch('/teams/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (teamId: string) => apiFetch(`/teams/${teamId}`),
  update: (teamId: string, data: any) =>
    apiFetch(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (teamId: string) => apiFetch(`/teams/${teamId}`, { method: 'DELETE' }),
  getMembers: (teamId: string) => apiFetch(`/teams/${teamId}/members`),
  addMember: (teamId: string, userId: string, role = 'member') =>
    apiFetch(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    }),
  removeMember: (teamId: string, userId: string) =>
    apiFetch(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
  updateMemberRole: (teamId: string, userId: string, role: string) =>
    apiFetch(`/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// ===========================
// WORKFLOW AUTOMATION
// ===========================
export const workflowApi = {
  list: () => apiFetch('/workflows/'),
  create: (data: { name: string; trigger: string; actions: any[] }) =>
    apiFetch('/workflows/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (workflowId: string) => apiFetch(`/workflows/${workflowId}`),
  update: (workflowId: string, data: any) =>
    apiFetch(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (workflowId: string) => apiFetch(`/workflows/${workflowId}`, { method: 'DELETE' }),
  enable: (workflowId: string) => apiFetch(`/workflows/${workflowId}/enable`, { method: 'POST' }),
  disable: (workflowId: string) => apiFetch(`/workflows/${workflowId}/disable`, { method: 'POST' }),
  getLogs: (workflowId: string) => apiFetch(`/workflows/${workflowId}/logs`),
  getTriggers: () => apiFetch('/workflows/triggers'),
  getActions: () => apiFetch('/workflows/actions'),
};

// ===========================
// KNOWLEDGE BASE
// ===========================
export const knowledgeBaseApi = {
  getCategories: () => apiFetch('/knowledge-base/categories'),
  getArticles: (categoryId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    return apiFetch(`/knowledge-base/articles?${params}`);
  },
  getArticle: (articleId: string) => apiFetch(`/knowledge-base/articles/${articleId}`),
  searchArticles: (query: string) =>
    apiFetch(`/knowledge-base/search?q=${encodeURIComponent(query)}`),
  getPopular: () => apiFetch('/knowledge-base/popular'),
  rateArticle: (articleId: string, helpful: boolean) =>
    apiFetch(`/knowledge-base/articles/${articleId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    }),
};

// ===========================
// FILE VERSIONS
// ===========================
export const fileVersionsApi = {
  getVersions: (fileId: string) => apiFetch(`/file-versions/${fileId}`),
  uploadVersion: (fileId: string, file: File, notes?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);
    return apiFetch(`/file-versions/${fileId}`, {
      method: 'POST',
      body: formData,
    });
  },
  getVersion: (fileId: string, versionId: string) =>
    apiFetch(`/file-versions/${fileId}/versions/${versionId}`),
  restoreVersion: (fileId: string, versionId: string) =>
    apiFetch(`/file-versions/${fileId}/versions/${versionId}/restore`, { method: 'POST' }),
  deleteVersion: (fileId: string, versionId: string) =>
    apiFetch(`/file-versions/${fileId}/versions/${versionId}`, { method: 'DELETE' }),
  compare: (fileId: string, versionA: string, versionB: string) =>
    apiFetch(`/file-versions/${fileId}/compare?version_a=${versionA}&version_b=${versionB}`),
};

// ===========================
// MULTI-CURRENCY
// ===========================
export const multiCurrencyApi = {
  getSupportedCurrencies: () => apiFetch('/multi-currency/currencies'),
  getExchangeRates: (baseCurrency = 'USD') =>
    apiFetch(`/multi-currency/rates?base=${baseCurrency}`),
  convert: (amount: number, from: string, to: string) =>
    apiFetch(`/multi-currency/convert?amount=${amount}&from=${from}&to=${to}`),
  getPreferredCurrency: () => apiFetch('/multi-currency/preference'),
  setPreferredCurrency: (currency: string) =>
    apiFetch('/multi-currency/preference', {
      method: 'PUT',
      body: JSON.stringify({ currency }),
    }),
};

// ===========================
// SMART MATCHING
// ===========================
export const matchingApi = {
  findFreelancers: (projectId: number, limit = 20) =>
    apiFetch(`/matching/project/${projectId}/freelancers?limit=${limit}`),
  findJobs: (limit = 20) => apiFetch(`/matching/projects?limit=${limit}`),
  getMatchScore: (projectId: number, freelancerId: number) =>
    apiFetch(`/matching/score?project_id=${projectId}&freelancer_id=${freelancerId}`),
  getRecommendations: () => apiFetch('/matching/recommendations'),
  updatePreferences: (preferences: any) =>
    apiFetch('/matching/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// ===========================
// GAMIFICATION
// ===========================
export const gamificationApi = {
  getMyRank: async () => {
    // Try to fetch from backend, but return mock data if not available
    try {
      return await apiFetch('/gamification/my-rank');
    } catch {
      // Return mock rank data when endpoint doesn't exist
      return { rank: 'Silver', percentile: 50, points: 1250, level: 3 };
    }
  },
  getBadges: () => apiFetch('/gamification/badges'),
  getLeaderboard: (limit = 10) => apiFetch(`/gamification/leaderboard?limit=${limit}`),
  getAchievements: () => apiFetch('/gamification/achievements'),
};

// ===========================
// FRAUD DETECTION
// ===========================
export const fraudDetectionApi = {
  checkUser: (userId: number) => apiFetch(`/fraud-detection/analyze/user/${userId}`),
  checkProject: (projectId: number) => apiFetch(`/fraud-detection/analyze/project/${projectId}`),
  checkProposal: (proposalId: number) => apiFetch(`/fraud-detection/analyze/proposal/${proposalId}`),
  checkTransaction: (transactionId: string) =>
    apiFetch(`/fraud-detection/transaction/${transactionId}`),
  reportSuspicious: (data: { type: string; target_id: string; reason: string; details?: string }) =>
    apiFetch('/fraud-detection/report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAlerts: () => apiFetch('/fraud-detection/alerts'),
  dismissAlert: (alertId: string) =>
    apiFetch(`/fraud-detection/alerts/${alertId}/dismiss`, { method: 'POST' }),
};

// ===========================
// VIDEO CALLS
// ===========================
export const videoCallsApi = {
  createRoom: (data: { participant_ids: string[]; scheduled_at?: string }) =>
    apiFetch('/video-calls/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRoom: (roomId: string) => apiFetch(`/video-calls/rooms/${roomId}`),
  joinRoom: (roomId: string) => apiFetch(`/video-calls/rooms/${roomId}/join`, { method: 'POST' }),
  leaveRoom: (roomId: string) => apiFetch(`/video-calls/rooms/${roomId}/leave`, { method: 'POST' }),
  endCall: (roomId: string) => apiFetch(`/video-calls/rooms/${roomId}/end`, { method: 'POST' }),
  getHistory: () => apiFetch('/video-calls/history'),
  getRecording: (roomId: string) => apiFetch(`/video-calls/rooms/${roomId}/recording`),
};

// ===========================
// LEGAL DOCUMENTS
// ===========================
export const legalDocsApi = {
  getDocuments: () => apiFetch('/legal-documents/'),
  getDocument: (docType: string) => apiFetch(`/legal-documents/${docType}`),
  getVersion: (docType: string, version: string) =>
    apiFetch(`/legal-documents/${docType}/versions/${version}`),
  acceptDocument: (docType: string) =>
    apiFetch(`/legal-documents/${docType}/accept`, { method: 'POST' }),
  getAcceptanceHistory: () => apiFetch('/legal-documents/acceptance-history'),
};

// ===========================
// PORTFOLIO SHOWCASE
// ===========================
export const portfolioShowcaseApi = {
  getShowcase: (userId: string) => apiFetch(`/portfolio-showcase/user/${userId}`),
  updateLayout: (layout: any) =>
    apiFetch('/portfolio-showcase/layout', {
      method: 'PUT',
      body: JSON.stringify(layout),
    }),
  getTemplates: () => apiFetch('/portfolio-showcase/templates'),
  applyTemplate: (templateId: string) =>
    apiFetch(`/portfolio-showcase/templates/${templateId}/apply`, { method: 'POST' }),
  getAnalytics: () => apiFetch('/portfolio-showcase/analytics'),
  togglePublic: (isPublic: boolean) =>
    apiFetch('/portfolio-showcase/visibility', {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic }),
    }),
};

// ===========================
// SKILL TAXONOMY
// ===========================
export const skillTaxonomyApi = {
  getCategories: () => apiFetch('/skill-taxonomy/categories'),
  getSkills: (categoryId?: string) => {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return apiFetch(`/skill-taxonomy/skills${params}`);
  },
  getSkill: (skillId: string) => apiFetch(`/skill-taxonomy/skills/${skillId}`),
  getRelated: (skillId: string) => apiFetch(`/skill-taxonomy/skills/${skillId}/related`),
  search: (query: string) => apiFetch(`/skill-taxonomy/search?q=${encodeURIComponent(query)}`),
  getTrending: () => apiFetch('/skill-taxonomy/trending'),
};

// ===========================
// NOTES & TAGS
// ===========================
export const notesTagsApi = {
  getNotes: (resourceType: string, resourceId: string) =>
    apiFetch(`/notes-tags/notes/${resourceType}/${resourceId}`),
  createNote: (resourceType: string, resourceId: string, content: string) =>
    apiFetch(`/notes-tags/notes/${resourceType}/${resourceId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateNote: (noteId: string, content: string) =>
    apiFetch(`/notes-tags/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  deleteNote: (noteId: string) => apiFetch(`/notes-tags/notes/${noteId}`, { method: 'DELETE' }),
  getTags: (resourceType: string, resourceId: string) =>
    apiFetch(`/notes-tags/tags/${resourceType}/${resourceId}`),
  addTag: (resourceType: string, resourceId: string, tag: string) =>
    apiFetch(`/notes-tags/tags/${resourceType}/${resourceId}`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    }),
  removeTag: (resourceType: string, resourceId: string, tag: string) =>
    apiFetch(`/notes-tags/tags/${resourceType}/${resourceId}/${encodeURIComponent(tag)}`, { method: 'DELETE' }),
};

// ===========================
// REVIEW RESPONSES
// ===========================
export const reviewResponsesApi = {
  getResponse: (reviewId: number) => apiFetch(`/review-responses/${reviewId}`),
  createResponse: (reviewId: number, response: string) =>
    apiFetch(`/review-responses/${reviewId}`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),
  updateResponse: (reviewId: number, response: string) =>
    apiFetch(`/review-responses/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    }),
  deleteResponse: (reviewId: number) =>
    apiFetch(`/review-responses/${reviewId}`, { method: 'DELETE' }),
};

// ===========================
// ACTIVITY FEED
// ===========================
export const activityFeedApi = {
  list: (filters?: { type?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/activity-feed/?${params}`);
  },
  get: (activityId: number) => apiFetch(`/activity-feed/${activityId}`),
  markAsRead: (activityId: number) =>
    apiFetch(`/activity-feed/${activityId}/read`, { method: 'POST' }),
  markAllAsRead: () => apiFetch('/activity-feed/read-all', { method: 'POST' }),
  getUnreadCount: () => apiFetch('/activity-feed/unread-count'),
};

// ===========================
// INTEGRATIONS
// ===========================
export const integrationsApi = {
  list: () => apiFetch('/integrations/'),
  get: (integrationId: string) => apiFetch(`/integrations/${integrationId}`),
  connect: (provider: string, data?: any) =>
    apiFetch(`/integrations/${provider}/connect`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  disconnect: (integrationId: string) =>
    apiFetch(`/integrations/${integrationId}/disconnect`, { method: 'POST' }),
  sync: (integrationId: string) =>
    apiFetch(`/integrations/${integrationId}/sync`, { method: 'POST' }),
  getSettings: (integrationId: string) =>
    apiFetch(`/integrations/${integrationId}/settings`),
  updateSettings: (integrationId: string, settings: any) =>
    apiFetch(`/integrations/${integrationId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getAvailable: () => apiFetch('/integrations/available'),
};

// ===========================
// USER FEEDBACK
// ===========================
export const userFeedbackApi = {
  submit: (data: { type: string; message: string; page?: string; rating?: number }) =>
    apiFetch('/user-feedback/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (filters?: { type?: string; status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/user-feedback/?${params}`);
  },
  get: (feedbackId: number) => apiFetch(`/user-feedback/${feedbackId}`),
  update: (feedbackId: number, data: { status?: string; admin_response?: string }) =>
    apiFetch(`/user-feedback/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ===========================
// VERIFICATION
// ===========================
export const verificationApi = {
  getStatus: () => apiFetch('/verification/status'),
  getDocuments: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('document_type', type);
    if (status) params.append('status', status);
    return apiFetch(`/verification/documents?${params}`);
  },
  uploadDocument: (data: FormData) => 
    apiFetch('/verification/upload-document', {
      method: 'POST',
      body: data,
    }),
  uploadSelfie: (data: FormData) => 
    apiFetch('/verification/upload-selfie', {
      method: 'POST',
      body: data,
    }),
  getTiers: () => apiFetch('/verification/tiers'),
  getSupportedDocuments: () => apiFetch('/verification/supported-documents'),
  sendPhoneCode: (phoneNumber: string) => 
    apiFetch('/verification/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),
  verifyPhoneCode: (phoneNumber: string, code: string) => 
    apiFetch('/verification/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, verification_code: code }),
    }),
};

// ===========================
// AI WRITING
// ===========================
export const aiWritingApi = {
  generateProposal: (data: {
    project_title: string;
    project_description: string;
    user_skills: string[];
    user_experience?: string;
    tone?: string;
    highlight_points?: string[];
  }) =>
    apiFetch<{ content: string }>('/ai-writing/generate/proposal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateProjectDescription: (data: {
    project_type: string;
    key_features: string[];
    target_audience?: string;
    budget_range?: string;
    tone?: string;
  }) =>
    apiFetch<{ content: string }>('/ai-writing/generate/project-description', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  improveText: (data: {
    content: string;
    content_type: string;
    improvements?: string[];
  }) =>
    apiFetch<{ content: string }>('/ai-writing/improve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  analyzeFeasibility: (data: {
    project_description: string;
    budget_min: number;
    budget_max: number;
    timeline_days: number;
  }) =>
    apiFetch<{
      complexity_score: number;
      budget_realism: string;
      timeline_realism: string;
      flags: string[];
      recommendations: string[];
    }>('/ai-writing/analyze/feasibility', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateUpsellSuggestions: (data: {
    project_description: string;
    proposal_content: string;
  }) =>
    apiFetch<{ suggestions: { title: string; description: string; type: string }[] }>('/ai-writing/generate/upsell', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default {
  auth: authApi,
  analytics: analyticsApi,
  timeEntries: timeEntriesApi,
  invoices: invoicesApi,
  escrow: escrowApi,
  categories: categoriesApi,
  tags: tagsApi,
  favorites: favoritesApi,
  supportTickets: supportTicketsApi,
  refunds: refundsApi,
  search: searchApi,
  projects: projectsApi,
  contracts: contractsApi,
  proposals: proposalsApi,
  messages: messagesApi,
  notifications: notificationsApi,
  payments: paymentsApi,
  reviews: reviewsApi,
  jobAlerts: jobAlertsApi,
  portal: portalApi,
  admin: adminApi,
  client: clientApi,
  skills: skillsApi,
  portfolio: portfolioApi,
  payoutMethods: payoutMethodsApi,
  paymentMethods: paymentMethodsApi,
  users: usersApi,
  milestones: milestonesApi,
  disputes: disputesApi,
  searches: searchesApi,
  uploads: uploadsApi,
  verification: verificationApi,
  ai: aiApi,
  aiWriting: aiWritingApi,
  socialAuth: socialAuthApi,
  // New API integrations
  referral: referralApi,
  career: careerApi,
  availability: availabilityApi,
  rateCards: rateCardsApi,
  proposalTemplates: proposalTemplatesApi,
  auditTrail: auditTrailApi,
  branding: brandingApi,
  communication: communicationApi,
  metrics: metricsApi,
  searchAnalytics: searchAnalyticsApi,
  compliance: complianceApi,
  twoFactor: twoFactorApi,
  webhooks: webhooksApi,
  apiKeys: apiKeysApi,
  teams: teamsApi,
  workflow: workflowApi,
  knowledgeBase: knowledgeBaseApi,
  fileVersions: fileVersionsApi,
  multiCurrency: multiCurrencyApi,
  matching: matchingApi,
  gamification: gamificationApi,
  fraudDetection: fraudDetectionApi,
  videoCalls: videoCallsApi,
  legalDocs: legalDocsApi,
  portfolioShowcase: portfolioShowcaseApi,
  skillTaxonomy: skillTaxonomyApi,
  notesTags: notesTagsApi,
  reviewResponses: reviewResponsesApi,
};
