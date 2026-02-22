import { auth } from '../lib/firebase';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Attach Firebase ID token if a user is signed in
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const api = {
  auth: {
    /** Called after Firebase sign-in/up to sync or create the player profile */
    syncProfile: (data?: { username?: string; minecraftUuid?: string }) =>
      request<{ player: any; townMembership: any }>('/auth/profile', { method: 'POST', body: JSON.stringify(data ?? {}) }),
    me: () => request<any>('/auth/me'),
  },

  // Towns
  towns: {
    list: () => request<any[]>('/towns'),
    get: (id: string) => request<any>(`/towns/${id}`),
    apply: (data: any) => request<any>('/towns/apply', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/towns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/towns/${id}`, { method: 'DELETE' }),
    approve: (id: string) => request<any>(`/towns/${id}/approve`, { method: 'POST' }),
    reject: (id: string) => request<any>(`/towns/${id}/reject`, { method: 'POST' }),
    addMember: (id: string, username: string) => request<any>(`/towns/${id}/add-member`, { method: 'POST', body: JSON.stringify({ username }) }),
  },

  // Wars
  wars: {
    list: (status?: string) => request<any[]>(`/wars${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<any>(`/wars/${id}`),
    declare: (data: any) => request<any>('/wars', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: any) => request<any>(`/wars/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    addBattle: (warId: string, data: any) => request<any>(`/wars/${warId}/battles`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Espionage
  espionage: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/espionage${qs}`);
    },
    get: (id: string) => request<any>(`/espionage/${id}`),
    create: (data: any) => request<any>('/espionage', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: any) => request<any>(`/espionage/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Trade
  trade: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/trade${qs}`);
    },
    get: (id: string) => request<any>(`/trade/${id}`),
    create: (data: any) => request<any>('/trade', { method: 'POST', body: JSON.stringify(data) }),
    buy: (id: string, quantity: number) => request<any>(`/trade/${id}/buy`, { method: 'POST', body: JSON.stringify({ quantity }) }),
    cancel: (id: string) => request<any>(`/trade/${id}`, { method: 'DELETE' }),
  },

  // Legal
  legal: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/legal${qs}`);
    },
    get: (id: string) => request<any>(`/legal/${id}`),
    file: (data: any) => request<any>('/legal', { method: 'POST', body: JSON.stringify(data) }),
    assignJudge: (id: string, judgeId: string) => request<any>(`/legal/${id}/assign-judge`, { method: 'PUT', body: JSON.stringify({ judgeId }) }),
    updateStatus: (id: string, data: any) => request<any>(`/legal/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    issueVerdict: (id: string, data: any) => request<any>(`/legal/${id}/verdict`, { method: 'POST', body: JSON.stringify(data) }),
    addComment: (id: string, data: any) => request<any>(`/legal/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Players
  players: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/players${qs}`);
    },
    get: (id: string) => request<any>(`/players/${id}`),
    stats: () => request<any>('/players/stats/overview'),
  },
};
