'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Invalid Reset Link</p>
            <p className="text-sm mt-1">This reset link is invalid or has expired.</p>
          </div>
          <Link href="/forgot-password" className="btn-primary inline-block">
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!username && !password) {
      setError('Please provide a new username or password');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        username: username || undefined,
        password: password || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset credentials. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <i className="lni lni-reload text-2xl text-white"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Reset Credentials</h1>
          <p className="text-gray-600">Set a new username and/or password</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Credentials updated!</p>
              <p className="text-sm mt-1">
                Your credentials have been updated successfully. You can now sign in with your new credentials.
              </p>
            </div>
            <Link href="/login" className="btn-primary w-full block text-center">
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Username <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Leave empty to keep current username"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Leave empty to keep current password"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirm your new password"
                disabled={!password}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mb-4"
            >
              {loading ? 'Updating...' : 'Update Credentials'}
            </button>

            <p className="text-center text-gray-600">
              <Link href="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <i className="lni lni-spinner-arrow text-4xl text-primary animate-spin"></i>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
