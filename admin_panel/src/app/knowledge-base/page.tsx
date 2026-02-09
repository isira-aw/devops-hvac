'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface KnowledgeEntry {
  id: number;
  title: string;
  content: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageData {
  content: KnowledgeEntry[];
  totalPages: number;
  totalElements: number;
  number: number;
}

const CATEGORIES = [
  'General',
  'AC Control',
  'Troubleshooting',
  'Maintenance',
  'Energy Efficiency',
  'Installation',
  'Safety',
  'FAQ',
];

export default function KnowledgeBasePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEntries(currentPage);
    }
  }, [isAuthenticated, currentPage]);

  const loadEntries = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminApi.getKnowledgeBase(page, 10);
      setPageData(response.data);
      setEntries(response.data.content);
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({ title: '', content: '', category: 'General', isActive: true });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      isActive: entry.active,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingEntry) {
        await adminApi.updateKnowledgeBase(editingEntry.id, formData);
      } else {
        await adminApi.createKnowledgeBase(formData);
      }
      setShowModal(false);
      loadEntries(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteKnowledgeBase(id);
      setDeleteConfirm(null);
      loadEntries(currentPage);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  if (isLoading) {
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
            className="flex items-center space-x-2 px-4 py-3 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <i className="lni lni-users"></i>
            <span>Admins</span>
          </Link>
          <Link
            href="/knowledge-base"
            className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-20 rounded-lg"
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Knowledge Base</h1>
            <p className="text-gray-500 mt-1">
              Manage chatbot knowledge base entries for HVAC support
            </p>
          </div>
          <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
            <i className="lni lni-plus"></i>
            <span>Add Entry</span>
          </button>
        </div>

        {/* Entries Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <i className="lni lni-spinner-arrow text-3xl text-primary animate-spin"></i>
              <p className="mt-4 text-gray-500">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <i className="lni lni-book text-5xl text-gray-300"></i>
              <p className="mt-4 text-gray-500">No knowledge base entries yet</p>
              <button onClick={openCreateModal} className="btn-primary mt-4">
                Add Your First Entry
              </button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Updated</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">
                          {entry.content.substring(0, 80)}...
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {entry.category}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {entry.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-500">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="text-primary hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <i className="lni lni-pencil-alt"></i>
                          </button>
                          {deleteConfirm === entry.id ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              <i className="lni lni-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pageData && pageData.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {entries.length} of {pageData.totalElements} entries
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage + 1} of {pageData.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(pageData.totalPages - 1, currentPage + 1))
                      }
                      disabled={currentPage >= pageData.totalPages - 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-primary">
                {editingEntry ? 'Edit Entry' : 'New Knowledge Base Entry'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="e.g., How to reset the AC unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input min-h-[200px]"
                  placeholder="Enter the knowledge base content here. This will be used by the chatbot to answer customer questions..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible to chatbot)
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? (
                  <span className="flex items-center space-x-2">
                    <i className="lni lni-spinner-arrow animate-spin"></i>
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>{editingEntry ? 'Update' : 'Create'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
