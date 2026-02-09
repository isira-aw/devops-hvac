'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  location: string;
  accessPassword: string;
  licensed: boolean;
  requireEmailVerification: boolean;
  allowedEmails: string[];
  allowedEmailDomain: string;
  online: boolean;
  createdAt: string;
}

interface PageData {
  content: Device[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export default function DevicesPage() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);

  // Form states
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [isLicensed, setIsLicensed] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState('');
  const [allowedEmailDomain, setAllowedEmailDomain] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDevices();
    }
  }, [isAuthenticated, currentPage]);

  const loadDevices = async () => {
    try {
      const response = await adminApi.getDevices(currentPage, 10);
      setDevices(response.data.content);
      setPageData(response.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditDevice(null);
    setDeviceId('');
    setDeviceName('');
    setLocation('');
    setAccessPassword('');
    setIsLicensed(true);
    setRequireEmailVerification(false);
    setAllowedEmails('');
    setAllowedEmailDomain('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (device: Device) => {
    setEditDevice(device);
    setDeviceId(device.deviceId);
    setDeviceName(device.deviceName);
    setLocation(device.location);
    setAccessPassword(device.accessPassword || '');
    setIsLicensed(device.licensed);
    setRequireEmailVerification(device.requireEmailVerification);
    setAllowedEmails(device.allowedEmails?.join(', ') || '');
    setAllowedEmailDomain(device.allowedEmailDomain || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      deviceId,
      deviceName,
      location,
      accessPassword: accessPassword || undefined,
      isLicensed,
      requireEmailVerification,
      allowedEmails: allowedEmails ? allowedEmails.split(',').map(e => e.trim()) : [],
      allowedEmailDomain: allowedEmailDomain || undefined,
    };

    try {
      if (editDevice) {
        await adminApi.updateDevice(editDevice.deviceId, data);
      } else {
        await adminApi.registerDevice(data);
      }
      setShowModal(false);
      loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await adminApi.deleteDevice(deviceId);
      loadDevices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleToggleLicense = async (device: Device) => {
    try {
      await adminApi.updateLicense(device.deviceId, !device.licensed);
      loadDevices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update license');
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
            className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-20 rounded-lg"
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
          <h1 className="text-3xl font-bold text-primary">Device Management</h1>
          <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
            <i className="lni lni-plus"></i>
            <span>Register Device</span>
          </button>
        </div>

        {/* Devices Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Device ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Location</th>
                <th className="table-header">Password</th>
                <th className="table-header">Licensed</th>
                <th className="table-header">Email Verify</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="table-cell font-mono text-sm">{device.deviceId}</td>
                  <td className="table-cell">{device.deviceName}</td>
                  <td className="table-cell">{device.location}</td>
                  <td className="table-cell font-mono text-sm">{device.accessPassword || '-'}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleToggleLicense(device)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        device.licensed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {device.licensed ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded text-xs ${
                      device.requireEmailVerification
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {device.requireEmailVerification ? 'Required' : 'Open'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className={`w-3 h-3 rounded-full ${device.online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(device)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <i className="lni lni-pencil"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(device.deviceId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="lni lni-trash-can"></i>
                      </button>
                    </div>
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
          <div className="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editDevice ? 'Edit Device' : 'Register New Device'}
              </h2>
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
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device ID *
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="input"
                    placeholder="e.g., YORK-001"
                    required
                    disabled={!!editDevice}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Password
                  </label>
                  <input
                    type="text"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isLicensed"
                    checked={isLicensed}
                    onChange={(e) => setIsLicensed(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isLicensed" className="text-sm text-gray-700">
                    Device is Licensed
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireEmail"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="requireEmail" className="text-sm text-gray-700">
                    Require Email Verification
                  </label>
                </div>
              </div>

              {requireEmailVerification && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Emails (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={allowedEmails}
                      onChange={(e) => setAllowedEmails(e.target.value)}
                      className="input"
                      placeholder="user1@example.com, user2@example.com"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Email Domain
                    </label>
                    <input
                      type="text"
                      value={allowedEmailDomain}
                      onChange={(e) => setAllowedEmailDomain(e.target.value)}
                      className="input"
                      placeholder="e.g., company.com"
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2">
                <button type="submit" className="btn-primary flex-1">
                  {editDevice ? 'Update Device' : 'Register Device'}
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
