'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  licensedDevices: number;
  totalUsers: number;
  unresolvedFaults: number;
  totalEnergyToday: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <i className="lni lni-spinner-arrow text-4xl text-primary animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-primary text-white p-6">
        <div className="flex items-center space-x-2 mb-8">
          <i className="lni lni-shield text-2xl"></i>
          <span className="text-xl font-bold">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-20 rounded-lg"
          >
            <i className="lni lni-dashboard"></i>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/devices"
            className="flex items-center space-x-2 px-4 py-3 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <i className="lni lni-cog"></i>
            <span>Devices</span>
          </Link>
          <Link
            href="/admins"
            className="flex items-center space-x-2 px-4 py-3 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <i className="lni lni-users"></i>
            <span>Admins</span>
          </Link>
          <Link
            href="/knowledge-base"
            className="flex items-center space-x-2 px-4 py-3 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <i className="lni lni-book"></i>
            <span>Knowledge Base</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-sm opacity-75 mb-2">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <h1 className="text-3xl font-bold text-primary mb-8">System Overview</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="lni lni-package text-2xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <i className="lni lni-signal text-2xl text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Online Devices</p>
                <p className="text-3xl font-bold text-green-600">{stats?.onlineDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="lni lni-checkmark-circle text-2xl text-purple-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Licensed Devices</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.licensedDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="lni lni-users text-2xl text-yellow-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <i className="lni lni-warning text-2xl text-red-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unresolved Faults</p>
                <p className="text-3xl font-bold text-red-600">{stats?.unresolvedFaults || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="lni lni-bolt text-2xl text-orange-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Energy Today</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalEnergyToday?.toFixed(1) || 0} kWh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/devices"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <i className="lni lni-plus text-xl text-primary"></i>
              <span>Register New Device</span>
            </Link>
            <Link
              href="/admins"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <i className="lni lni-user text-xl text-primary"></i>
              <span>Manage Admins</span>
            </Link>
            <Link
              href="/devices"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <i className="lni lni-list text-xl text-primary"></i>
              <span>View All Devices</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
