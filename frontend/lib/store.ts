import { useSyncExternalStore } from 'react';
import { config } from './config';
import {
  AppNotification,
  Deal,
  Property,
  PropertyStatus,
  Task,
  User,
} from './types';

export interface AppState {
  users: User[];
  properties: Property[];
  deals: Deal[];
  tasks: Task[];
  notifications: AppNotification[];
}

let state: AppState = {
  users: [],
  properties: [],
  deals: [],
  tasks: [],
  notifications: [],
};

const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}
function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

let currentUserId: string | undefined;

async function apiFetch(path: string, options?: RequestInit) {
  const baseUrl = config.apiBaseUrl;
  const res = await fetch(`${baseUrl}${path}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: options?.body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function refresh(userId?: string) {
  const uid = userId || currentUserId;
  if (uid) currentUserId = uid;
  
  try {
    const [users, properties, deals, tasks, statusChangesList] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/properties'),
      apiFetch('/deals'),
      apiFetch('/tasks'),
      apiFetch('/status-changes'),
    ]);

    let notifications = [];
    if (uid) {
      notifications = await apiFetch(`/notifications/${uid}`);
    }

    const formattedUsers = users.map((u: any) => ({ ...u, _id: u.id || u._id }));
    const formattedProperties = properties.map((p: any) => ({ ...p, _id: p.id || p._id }));
    const formattedDeals = deals.map((d: any) => ({ ...d, _id: d.id || d._id }));
    const formattedTasks = tasks.map((t: any) => ({ ...t, _id: t.id || t._id }));
    const formattedNotifications = notifications.map((n: any) => ({ ...n, _id: n.id || n._id }));

    pendingStatusChanges = statusChangesList;
    setState({
      users: formattedUsers,
      properties: formattedProperties,
      deals: formattedDeals,
      tasks: formattedTasks,
      notifications: formattedNotifications,
    });
  } catch (e) {
    console.error('Failed to refresh store:', e);
  }
}

// ---- Actions (API driven) ----

export const actions = {
  async login(email: string, password: string): Promise<{ user: User; sessionToken: string }> {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const formattedUser = { ...data, _id: data.id || data._id };
    currentUserId = formattedUser._id;
    refresh(formattedUser._id);
    return { user: formattedUser, sessionToken: data.sessionToken };
  },

  async verifySession(sessionToken: string): Promise<User | null> {
    try {
      const data = await apiFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ sessionToken }),
      });
      const formattedUser = { ...data, _id: data.id || data._id };
      currentUserId = formattedUser._id;
      refresh(formattedUser._id);
      return formattedUser;
    } catch {
      return null;
    }
  },

  async addProperty(input: Omit<Property, '_id' | 'createdAt' | 'updatedAt' | 'images' | 'status'> & { status?: PropertyStatus }) {
    try {
      await apiFetch('/properties', {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          location: input.location,
          type: input.type,
          askingPrice: input.askingPrice,
          assignedEmployeeId: input.assignedEmployeeId,
        }),
      });
      await refresh();
    } catch (e) {
      console.error('Add property error:', e);
    }
  },

  async updatePropertyStatus(propertyId: string, status: PropertyStatus, byUserId: string) {
    try {
      const res = await apiFetch(`/properties/${propertyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          byUserId,
          requireApproval: config.requireOwnerApproval,
        }),
      });
      await refresh();
      return { queued: !!res.queued };
    } catch (e) {
      console.error('Update property status error:', e);
      return { queued: false };
    }
  },

  async resolveStatusChange(changeId: string, approve: boolean, ownerId: string) {
    try {
      await apiFetch(`/status-changes/${changeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      });
      await refresh();
    } catch (e) {
      console.error('Resolve status change error:', e);
    }
  },

  async logDeal(input: { propertyId: string; employeeId: string; source: Deal['source']; agentName?: string; negotiatedPrice: number; finalPrice: number; commissionRate?: number }) {
    try {
      await apiFetch('/deals', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: input.propertyId,
          employeeId: input.employeeId,
          source: input.source,
          agentName: input.agentName,
          negotiatedPrice: input.negotiatedPrice,
          finalPrice: input.finalPrice,
          commissionRate: input.commissionRate,
          requireApproval: config.requireOwnerApproval,
        }),
      });
      await refresh();
    } catch (e) {
      console.error('Log deal error:', e);
    }
  },

  async resolveDeal(dealId: string, approve: boolean) {
    try {
      await apiFetch(`/deals/${dealId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ approve }),
      });
      await refresh();
    } catch (e) {
      console.error('Resolve deal error:', e);
    }
  },

  async editProperty(propertyId: string, patch: Partial<Property>) {
    try {
      await apiFetch(`/properties/${propertyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: patch.title,
          location: patch.location,
          type: patch.type,
          askingPrice: patch.askingPrice,
          assignedEmployeeId: patch.assignedEmployeeId,
        }),
      });
      await refresh();
    } catch (e) {
      console.error('Edit property error:', e);
    }
  },

  async archiveProperty(propertyId: string) {
    try {
      await apiFetch(`/properties/${propertyId}`, {
        method: 'DELETE',
      });
      await refresh();
    } catch (e) {
      console.error('Archive property error:', e);
    }
  },

  async setDealPaymentStatus(dealId: string, paymentStatus: Deal['paymentStatus']) {
    try {
      await apiFetch(`/deals/${dealId}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus }),
      });
      await refresh();
    } catch (e) {
      console.error('Set deal payment status error:', e);
    }
  },

  async addTask(input: Omit<Task, '_id' | 'createdAt' | 'status'>) {
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          type: input.type,
          assignedTo: input.assignedTo,
          assignedBy: input.assignedBy,
          propertyId: input.propertyId,
          dueDate: input.dueDate,
        }),
      });
      await refresh();
    } catch (e) {
      console.error('Add task error:', e);
    }
  },

  async setTaskStatus(taskId: string, status: Task['status']) {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (e) {
      console.error('Set task status error:', e);
    }
  },

  async markNotificationsRead(userId: string) {
    try {
      await apiFetch(`/notifications/${userId}/read`, {
        method: 'PUT',
      });
      await refresh();
    } catch (e) {
      console.error('Mark notifications read error:', e);
    }
  },
};

// Pending property status changes awaiting owner approval (PRD §7).
export interface StatusChangeRequest {
  _id: string;
  propertyId: string;
  requestedStatus: PropertyStatus;
  requestedBy: string;
  createdAt: string;
}
export let pendingStatusChanges: StatusChangeRequest[] = [];
export function usePendingStatusChanges(): StatusChangeRequest[] {
  useStore(); // re-render on any emit
  return pendingStatusChanges;
}
