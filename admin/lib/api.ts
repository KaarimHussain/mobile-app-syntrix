import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  is_blocked: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
}

export const api = {
  adminLogin: (email: string, password: string) =>
    request<{ token: string }>('/admin/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getOwners: () => request<Owner[]>('/admin/api/owners'),

  createOwner: (data: { name: string; email: string; phone?: string }) =>
    request<{ owner: Owner; generatedPassword: string }>('/admin/api/owners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOwner: (id: string, data: { name?: string; email?: string; phone?: string }) =>
    request<{ success: boolean }>(`/admin/api/owners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSubscription: (id: string, subscription_status: string, subscription_expires_at: string | null) =>
    request<{ success: boolean }>(`/admin/api/owners/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ subscription_status, subscription_expires_at }),
    }),

  toggleBlock: (id: string) =>
    request<{ success: boolean; is_blocked: boolean }>(`/admin/api/owners/${id}/block`, {
      method: 'PUT',
    }),

  deleteOwner: (id: string) =>
    request<{ success: boolean }>(`/admin/api/owners/${id}`, { method: 'DELETE' }),
};
