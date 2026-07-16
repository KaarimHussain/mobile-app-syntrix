'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Owner } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import OwnerTable from '@/components/OwnerTable';
import AddOwnerModal from '@/components/AddOwnerModal';

export default function DashboardPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadOwners();
  }, []);

  async function loadOwners() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getOwners();
      setOwners(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load owners';
      if (msg === 'Unauthorized' || msg === 'Invalid or expired token') {
        clearToken();
        router.push('/login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  const totalOwners = owners.length;
  const activeCount = owners.filter(o => o.subscription_status === 'active').length;
  const expiredCount = owners.filter(o => o.subscription_status === 'expired').length;
  const blockedCount = owners.filter(o => o.is_blocked).length;

  const stats = [
    { label: 'Total Owners', value: totalOwners, valueColor: 'text-text-heading' },
    { label: 'Active',        value: activeCount,  valueColor: 'text-primary' },
    { label: 'Expired',       value: expiredCount, valueColor: 'text-red-500' },
    { label: 'Blocked',       value: blockedCount, valueColor: 'text-text-subtle' },
  ];

  return (
    <div className="min-h-screen bg-primary-light">
      <header className="bg-white border-b border-primary-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-text-heading">Syntrix Admin</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-text-muted hover:text-text-heading transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-primary-border px-5 py-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.valueColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-primary-border">
          <div className="px-6 py-4 border-b border-primary-muted flex items-center justify-between">
            <h2 className="font-semibold text-text-heading">Owners</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-semibold"
            >
              + Add Owner
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-text-subtle text-sm">Loading...</div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={loadOwners} className="mt-3 text-sm text-primary hover:underline">Retry</button>
            </div>
          ) : (
            <OwnerTable owners={owners} onChange={setOwners} />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddOwnerModal
          onClose={() => setShowAddModal(false)}
          onCreated={owner => setOwners(prev => [owner, ...prev])}
        />
      )}
    </div>
  );
}
