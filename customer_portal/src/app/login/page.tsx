'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      setEmail(response.data.email);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.verify({ email, code });
      login(response.data.token, {
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google login failed: No credentials received');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      // Decode the JWT token from Google to get user info
      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);

      // Send to backend
      const response = await authApi.googleLogin({
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
      });

      // Login with the token from backend
      login(response.data.token, {
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again or use username/password.');
  };

  const isGoogleConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <i className="lni lni-cloud text-2xl text-white"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mb-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {isGoogleConfigured ? (
              <div className="flex justify-center">
                {googleLoading ? (
                  <div className="btn-secondary w-full flex items-center justify-center">
                    <span>Signing in with Google...</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                  />
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="btn-secondary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                title="Google OAuth2 is not configured"
              >
                <i className="lni lni-google"></i>
                <span>Google Sign-In Not Configured</span>
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit}>
            <div className="mb-4 text-center">
              <p className="text-gray-600">
                We sent a verification code to <strong>{email}</strong>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code (3 digits)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input text-center text-2xl tracking-widest"
                maxLength={3}
                placeholder="000"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mb-4"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="btn-secondary w-full"
            >
              Back to Login
            </button>
          </form>
        )}

        <p className="text-center mt-4">
          <Link href="/forgot-password" className="text-primary hover:underline text-sm">
            Forgot password or username?
          </Link>
        </p>

        <p className="text-center mt-4 text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>

        <p className="text-center mt-2">
          <Link href="/" className="text-gray-500 hover:underline text-sm">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
