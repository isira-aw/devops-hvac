'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now() && decoded.role === 'ADMIN') {
          window.location.href = '/knowledge-base';
          return;
        }
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login({ username, password });
      const data = response.data;

      if (data.requiresVerification) {
        setEmail(data.email);
        setStep('verify');
      } else if (data.token) {
        const decoded = jwtDecode<DecodedToken>(data.token);
        if (decoded.role !== 'ADMIN') {
          setError('Access denied. Admin credentials required.');
          return;
        }
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify({ username: decoded.sub, role: decoded.role }));
        window.location.href = '/knowledge-base';
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.verify({ email, code });
      const data = response.data;
      if (data.token) {
        const decoded = jwtDecode<DecodedToken>(data.token);
        if (decoded.role !== 'ADMIN') {
          setError('Access denied. Admin credentials required.');
          return;
        }
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify({ username: decoded.sub, role: decoded.role }));
        window.location.href = '/knowledge-base';
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#094166' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#094166' }}>
            Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            HVAC Chatbot Knowledge Base Management
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#094166' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              A verification code has been sent to <strong>{email}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-center text-lg tracking-widest"
                style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#094166' }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('login'); setError(''); }}
              className="w-full py-2 text-gray-600 text-sm hover:underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
