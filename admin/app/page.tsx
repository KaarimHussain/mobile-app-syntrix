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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Syntrix Admin</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Owners', value: totalOwners, color: 'text-gray-900' },
            { label: 'Active', value: activeCount, color: 'text-green-600' },
            { label: 'Expired', value: expiredCount, color: 'text-red-600' },
            { label: 'Blocked', value: blockedCount, color: 'text-gray-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Owners</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Owner
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={loadOwners} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
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
