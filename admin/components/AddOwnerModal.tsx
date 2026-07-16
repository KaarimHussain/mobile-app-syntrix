'use client';
import { useState } from 'react';
import { api, Owner } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreated: (owner: Owner) => void;
}

export default function AddOwnerModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<'form' | 'credentials'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.createOwner({ name, email, phone: phone || undefined });
      setCredentials({ email: res.owner.email, password: res.generatedPassword });
      setStep('credentials');
      onCreated(res.owner);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create owner');
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    const text = `Email: ${credentials!.email}\nPassword: ${credentials!.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-text-body placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";
  const btnPrimary = "flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors";
  const btnSecondary = "flex-1 border border-gray-300 text-text-muted rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-text-heading">Add New Owner</h2>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">Full Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="e.g. Kaarim Baig" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">Email Address *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="owner@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="0300-1234567" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Creating...' : 'Create Owner'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-heading">Owner Created</h2>
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Save these credentials now — the password will not be shown again.
            </p>
            <div className="bg-primary-light border border-primary-border rounded-lg p-4 space-y-2 font-mono text-sm">
              <div><span className="text-text-muted">Email:</span> <span className="font-semibold text-text-heading">{credentials!.email}</span></div>
              <div><span className="text-text-muted">Password:</span> <span className="font-semibold text-text-heading">{credentials!.password}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={copyCredentials} className={btnSecondary}>
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
              <button onClick={onClose} className={btnPrimary}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
