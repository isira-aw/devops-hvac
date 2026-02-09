'use client';

import { useState, useEffect, useCallback } from 'react';
import { knowledgeBaseApi } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface KnowledgeEntry {
  id: number;
  title: string;
  category: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  content: KnowledgeEntry[];
  totalPages: number;
  totalElements: number;
  number: number;
}

const CATEGORIES = [
  'General',
  'AC Control',
  'Maintenance',
  'Troubleshooting',
  'Energy Efficiency',
  'Installation',
  'Safety',
  'Technical Specs',
  'Customer Support',
  'FAQ',
];

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formContent, setFormContent] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    try {
      const decoded = jwtDecode<{ role: string; exp: number }>(token);
      if (decoded.role !== 'ADMIN' || decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await knowledgeBaseApi.getAll(page, 10);
      const data: PageResponse = response.data;
      setEntries(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to load knowledge base entries');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormTitle('');
    setFormCategory('General');
    setFormContent('');
    setFormIsActive(true);
    setShowModal(true);
    setError('');
  };

  const openEditModal = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormCategory(entry.category);
    setFormContent(entry.content);
    setFormIsActive(entry.isActive);
    setShowModal(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        title: formTitle,
        category: formCategory,
        content: formContent,
        isActive: formIsActive,
      };

      if (editingEntry) {
        await knowledgeBaseApi.update(editingEntry.id, data);
        setSuccess('Entry updated successfully');
      } else {
        await knowledgeBaseApi.create(data);
        setSuccess('Entry created successfully');
      }
      setShowModal(false);
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgeBaseApi.delete(id);
      setSuccess('Entry deleted successfully');
      setDeleteConfirm(null);
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete entry');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#094166' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#094166' }}>
                Knowledge Base Manager
              </h1>
              <p className="text-xs text-gray-500">HVAC Chatbot Administration</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Alerts */}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {totalElements} {totalElements === 1 ? 'entry' : 'entries'} total
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: '#094166' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Entry
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No knowledge base entries yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first entry to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900">{entry.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{entry.content.substring(0, 80)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {entry.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm rounded border bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm rounded border bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#094166' }}>
                {editingEntry ? 'Edit Entry' : 'New Knowledge Base Entry'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && showModal && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                  placeholder="e.g., How to reset AC unit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-y"
                  style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                  placeholder="Enter the knowledge base content here. This will be used by the chatbot to answer customer questions..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (included in chatbot responses)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-white rounded-lg font-medium transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#094166' }}
                >
                  {saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Create Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
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
