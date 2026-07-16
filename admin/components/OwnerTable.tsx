'use client';
import { useState } from 'react';
import { api, Owner } from '@/lib/api';
import SubscriptionModal from './SubscriptionModal';

interface Props {
  owners: Owner[];
  onChange: (owners: Owner[]) => void;
}

export default function OwnerTable({ owners, onChange }: Props) {
  const [subscriptionTarget, setSubscriptionTarget] = useState<Owner | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggleBlock(owner: Owner) {
    setLoadingId(owner.id);
    try {
      const res = await api.toggleBlock(owner.id);
      onChange(owners.map(o => o.id === owner.id ? { ...o, is_blocked: res.is_blocked } : o));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(owner: Owner) {
    if (!confirm(`Delete owner "${owner.name}"? This cannot be undone.`)) return;
    setLoadingId(owner.id);
    try {
      await api.deleteOwner(owner.id);
      onChange(owners.filter(o => o.id !== owner.id));
    } finally {
      setLoadingId(null);
    }
  }

  if (owners.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No owners yet.</p>
        <p className="text-sm mt-1">Click "Add Owner" to create the first one.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {owners.map(owner => (
              <tr key={owner.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{owner.name}</div>
                  <div className="text-gray-500 text-xs">{owner.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{owner.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    owner.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {owner.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {owner.subscription_expires_at
                    ? new Date(owner.subscription_expires_at).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {owner.is_blocked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Blocked</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSubscriptionTarget(owner)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                    >
                      Subscription
                    </button>
                    <button
                      onClick={() => handleToggleBlock(owner)}
                      disabled={loadingId === owner.id}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        owner.is_blocked
                          ? 'border-green-300 text-green-700 hover:bg-green-50'
                          : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                      } disabled:opacity-40`}
                    >
                      {owner.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDelete(owner)}
                      disabled={loadingId === owner.id}
                      className="text-xs px-2 py-1 border border-red-200 rounded-md hover:bg-red-50 text-red-600 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {subscriptionTarget && (
        <SubscriptionModal
          owner={subscriptionTarget}
          onClose={() => setSubscriptionTarget(null)}
          onUpdated={updated => {
            onChange(owners.map(o => o.id === updated.id ? updated : o));
            setSubscriptionTarget(null);
          }}
        />
      )}
    </>
  );
}
