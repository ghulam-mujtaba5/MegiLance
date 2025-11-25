// @AI-HINT: Comprehensive API client for MegiLance backend integration
// Provides type-safe methods for all backend endpoints with proper error handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Auth token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
}

// Generic fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===========================
// AUTHENTICATION
// ===========================
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiFetch<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  register: async (userData: { email: string; password: string; name: string; role: string }) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    setAuthToken(null);
  },

  refreshToken: async (refreshToken: string) => {
    const data = await apiFetch<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  me: () => apiFetch<any>('/auth/me'),

  updateProfile: (data: any) => apiFetch<any>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  get2FAStatus: () => apiFetch<{ enabled: boolean }>('/auth/2fa/status'),

  enable2FA: () => apiFetch<{ secret: string; qr_code_url: string; backup_codes: string[] }>('/auth/2fa/enable', { method: 'POST' }),

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
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/projects/?${params}`);
  },

  create: (data: any) =>
    apiFetch('/projects/', {
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
  list: (projectId?: number, page = 1, pageSize = 20) =>
    apiFetch(`/proposals/?${new URLSearchParams({ 
      ...(projectId && { project_id: projectId.toString() }), 
      page: page.toString(), 
      page_size: pageSize.toString() 
    })}`),

  getDrafts: (projectId: number) =>
    apiFetch(`/proposals/drafts?project_id=${projectId}`),

  create: (data: {
    project_id: number;
    cover_letter: string;
    proposed_rate: number;
    estimated_duration: string;
  }) =>
    apiFetch('/proposals/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}`),

  update: (proposalId: number, data: any) =>
    apiFetch(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  accept: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}/accept`, { method: 'POST' }),

  reject: (proposalId: number) =>
    apiFetch(`/proposals/${proposalId}/reject`, { method: 'POST' }),

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
};

// ===========================
// MESSAGES
// ===========================
export const messagesApi = {
  createConversation: (data: any) =>
    apiFetch('/messages/conversations', {
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
};

// ===========================
// CLIENT (Direct)
// ===========================
export const clientApi = {
  getProjects: () => apiFetch<any[]>('/client/projects'),
  getPayments: () => apiFetch<any[]>('/client/payments'),
  getFreelancers: () => apiFetch<any[]>('/client/freelancers'),
  getReviews: () => apiFetch<any[]>('/client/reviews'),
  createJob: (data: any) => apiFetch('/client/jobs', {
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
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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
    }>(`/ai/fraud-check/user/${userId}`),
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
  ai: aiApi,
};
