'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface Admin {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface PageData {
  content: Admin[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export default function AdminsPage() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdmins();
    }
  }, [isAuthenticated, currentPage]);

  const loadAdmins = async () => {
    try {
      const response = await adminApi.getAdmins(currentPage, 10);
      setAdmins(response.data.content);
      setPageData(response.data);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await adminApi.createAdmin({ username, email, password });
      setShowModal(false);
      loadAdmins();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create admin');
    }
  };

  const handleDelete = async (adminId: number, adminEmail: string) => {
    if (adminEmail === 'isira.aw@gmail.com') {
      alert('Cannot delete the default admin');
      return;
    }

    if (adminEmail === user?.email) {
      alert('Cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      await adminApi.deleteAdmin(adminId);
      loadAdmins();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <i className="lni lni-spinner-arrow text-4xl text-primary animate-spin"></i>
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
            className="flex items-center space-x-2 px-4 py-3 hover:bg-white hover:bg-opacity-10 rounded-lg"
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
            className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-20 rounded-lg"
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Management</h1>
          <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
            <i className="lni lni-plus"></i>
            <span>Add Admin</span>
          </button>
        </div>

        {/* Admins Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Username</th>
                <th className="table-header">Email</th>
                <th className="table-header">Created At</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="table-cell font-medium">{admin.username}</td>
                  <td className="table-cell">{admin.email}</td>
                  <td className="table-cell">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleDelete(admin.id, admin.email)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={admin.email === 'isira.aw@gmail.com' || admin.email === user?.email}
                    >
                      <i className="lni lni-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pageData && pageData.totalPages > 1 && (
            <div className="flex justify-center space-x-2 p-4 border-t">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="py-2 px-4">
                Page {currentPage + 1} of {pageData.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pageData.totalPages - 1, p + 1))}
                disabled={currentPage >= pageData.totalPages - 1}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Admin</h2>
              <button onClick={() => setShowModal(false)}>
                <i className="lni lni-close text-xl"></i>
              </button>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  required
                  minLength={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="btn-primary flex-1">
                  Create Admin
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
