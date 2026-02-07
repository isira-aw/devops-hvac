'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
              <i className="lni lni-key text-2xl text-white"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Forgot Password or Username</h1>
          <p className="text-gray-600">Enter your email to receive a recovery link</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Recovery link sent!</p>
              <p className="text-sm mt-1">
                If an account exists with <strong>{email}</strong>, you will receive an email with a link to reset your username and password.
              </p>
            </div>
            <Link href="/login" className="btn-primary w-full block text-center">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your registered email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mb-4"
            >
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>

            <p className="text-center text-gray-600">
              Remember your credentials?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        )}

        <p className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:underline text-sm">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
