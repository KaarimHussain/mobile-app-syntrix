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
      <div className="text-center py-16 text-text-subtle">
        <p className="text-lg font-medium">No owners yet.</p>
        <p className="text-sm mt-1">Click &quot;Add Owner&quot; to create the first one.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Subscription</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Expires</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {owners.map(owner => (
              <tr key={owner.id} className="hover:bg-primary-light transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-text-heading">{owner.name}</div>
                  <div className="text-text-muted text-xs mt-0.5">{owner.email}</div>
                </td>
                <td className="px-4 py-3 text-text-body">{owner.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    owner.subscription_status === 'active'
                      ? 'bg-primary-muted text-primary'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {owner.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-body">
                  {owner.subscription_expires_at
                    ? new Date(owner.subscription_expires_at).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {owner.is_blocked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-text-muted">Blocked</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-muted text-primary">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSubscriptionTarget(owner)}
                      className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-text-body transition-colors"
                    >
                      Subscription
                    </button>
                    <button
                      onClick={() => handleToggleBlock(owner)}
                      disabled={loadingId === owner.id}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 ${
                        owner.is_blocked
                          ? 'border-primary-border text-primary hover:bg-primary-light'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {owner.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDelete(owner)}
                      disabled={loadingId === owner.id}
                      className="text-xs px-2.5 py-1 border border-red-200 rounded-md hover:bg-red-50 text-red-600 transition-colors disabled:opacity-40"
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
