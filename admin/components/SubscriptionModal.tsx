'use client';
import { useState } from 'react';
import { api, Owner } from '@/lib/api';

interface Props {
  owner: Owner;
  onClose: () => void;
  onUpdated: (owner: Owner) => void;
}

export default function SubscriptionModal({ owner, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState(owner.subscription_status);
  const [expiresAt, setExpiresAt] = useState(
    owner.subscription_expires_at ? owner.subscription_expires_at.split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      await api.updateSubscription(owner.id, status, expiresAt || null);
      onUpdated({ ...owner, subscription_status: status, subscription_expires_at: expiresAt || null });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-text-heading">Manage Subscription</h2>
        <p className="text-sm text-text-muted">{owner.name} — {owner.email}</p>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-text-body mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-body mb-1">Expiry Date</label>
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputClass} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-text-muted rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
