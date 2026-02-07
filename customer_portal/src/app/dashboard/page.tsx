'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { customerApi } from '@/lib/api';
import Link from 'next/link';

interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  location: string;
  online: boolean;
  systemOn: boolean;
  mode: string;
  temperatureSetpoint: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState<Device | null>(null);
  const [assignDeviceId, setAssignDeviceId] = useState('');
  const [assignPassword, setAssignPassword] = useState('');
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDevices();
    }
  }, [isAuthenticated]);

  const loadDevices = async () => {
    try {
      const response = await customerApi.getDevices();
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await customerApi.assignDevice({
        deviceId: assignDeviceId,
        accessPassword: assignPassword || undefined,
      });
      setShowAssignModal(false);
      setAssignDeviceId('');
      setAssignPassword('');
      loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign device');
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to unassign this device?')) return;
    try {
      await customerApi.unassignDevice(deviceId);
      loadDevices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unassign device');
    }
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManageModal) return;

    try {
      await customerApi.updateDevice(showManageModal.deviceId, {
        deviceName: showManageModal.deviceName,
        location: showManageModal.location,
      });
      setShowManageModal(null);
      loadDevices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update device');
    }
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');

    if (newPassword && newPassword !== confirmNewPassword) {
      setCredentialsError('Passwords do not match');
      return;
    }

    if (!newUsername && !newPassword) {
      setCredentialsError('Please provide a new username or password');
      return;
    }

    setCredentialsLoading(true);

    try {
      await customerApi.changeCredentials({
        username: newUsername || undefined,
        password: newPassword || undefined,
      });
      setCredentialsSuccess('Credentials updated successfully');
      setNewUsername('');
      setNewPassword('');
      setConfirmNewPassword('');

      // Update local user info if username changed
      if (newUsername && user) {
        const updatedUser = { ...user, username: newUsername };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setCredentialsError(err.response?.data?.error || 'Failed to update credentials');
    } finally {
      setCredentialsLoading(false);
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
      {/* Header */}
      <header className="bg-primary text-white py-4 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <span className="text-lg md:text-xl font-bold">Smart HVAC</span>
          </div>

          {/* Desktop menu */}
          <div className=" hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="bg-white/10 px-2 py-2 rounded text-center">
              Dashboard
            </Link>
            <span>{user?.username}</span>
            <button
              onClick={() => {
                setShowCredentialsModal(true);
                setCredentialsError('');
                setCredentialsSuccess('');
              }}
              className="bg-white/10 px-2 py-2 rounded hover:bg-white/20 text-center"
              title="Change Password or Username"
            >
              <i className="lni lni-key"></i>
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 text-center"
            >
              Logout
            </button>
            <Link href="/" className=" text-white px-4 py-2 rounded-lg hover:bg-white/10">
              <i className="lni lni-home text-xl md:text-2xl"></i>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 hover:opacity-75"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`lni ${mobileMenuOpen ? 'lni-close' : 'lni-menu'} text-xl`}></i>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col space-y-3">
              <Link href="/dashboard" className="px-2 py-2 bg-white/10 rounded text-center ">
                Dashboard
              </Link>
                <span className="px-2 py-2 font-medium text-center">
                  <i className="lni lni-user mr-2 text-sm"></i>
                  <span>{user?.username}</span>
                </span>
              <button
                onClick={() => {
                  setShowCredentialsModal(true);
                  setCredentialsError('');
                  setCredentialsSuccess('');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-2 hover:bg-white/10 rounded text-center"
              >
                <i className="lni lni-key mr-2"></i>Change Password/Username
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 text-center"
              >
                Logout
              </button>
              <Link href="/" className="px-2 py-2 hover:bg-white/10 rounded text-center">
                <i className="lni lni-home text-xl md:text-2xl"></i>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">My Devices</h1>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <i className="lni lni-plus"></i>
            <span>Assign Device</span>
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="card text-center py-12">
            <i className="lni lni-package text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Devices Assigned</h2>
            <p className="text-gray-500 mb-4">
              Assign your first device to start monitoring and controlling your HVAC units.
            </p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn-primary"
            >
              Assign a Device
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div key={device.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{device.deviceName}</h3>
                    <p className="text-sm text-gray-500">{device.deviceId}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${device.online ? 'status-online' : 'status-offline'}`}></div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <i className="lni lni-map-marker"></i>
                    <span>{device.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="lni lni-power-switch"></i>
                    <span>{device.systemOn ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="lni lni-thermometer"></i>
                    <span>{device.temperatureSetpoint}°C</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="lni lni-cog"></i>
                    <span>{device.mode}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/${device.deviceId}`)}
                    className="btn-primary flex-1"
                  >
                    <i className="lni lni-dashboard mr-1"></i> View
                  </button>
                  <button
                    onClick={() => setShowManageModal(device)}
                    className="btn-secondary"
                  >
                    <i className="lni lni-cog"></i>
                  </button>
                  <button
                    onClick={() => handleUnassignDevice(device.deviceId)}
                    className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200"
                  >
                    <i className="lni lni-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Assign Device Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assign Device</h2>
              <button onClick={() => setShowAssignModal(false)}>
                <i className="lni lni-close text-xl"></i>
              </button>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAssignDevice}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device ID
                </label>
                <input
                  type="text"
                  value={assignDeviceId}
                  onChange={(e) => setAssignDeviceId(e.target.value)}
                  className="input"
                  placeholder="e.g., YORK-001"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Password (if required)
                </label>
                <input
                  type="password"
                  value={assignPassword}
                  onChange={(e) => setAssignPassword(e.target.value)}
                  className="input"
                  placeholder="Leave empty if not required"
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="btn-primary flex-1">
                  Assign Device
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password or Username</h2>
              <button onClick={() => setShowCredentialsModal(false)}>
                <i className="lni lni-close text-xl"></i>
              </button>
            </div>

            {credentialsError && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {credentialsError}
              </div>
            )}

            {credentialsSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                {credentialsSuccess}
              </div>
            )}

            <form onSubmit={handleChangeCredentials}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Username <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input"
                  placeholder="Confirm your new password"
                  disabled={!newPassword}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={credentialsLoading}
                  className="btn-primary flex-1"
                >
                  {credentialsLoading ? 'Updating...' : 'Update Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Device Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Device</h2>
              <button onClick={() => setShowManageModal(null)}>
                <i className="lni lni-close text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateDevice}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  value={showManageModal.deviceName}
                  onChange={(e) =>
                    setShowManageModal({ ...showManageModal, deviceName: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={showManageModal.location}
                  onChange={(e) =>
                    setShowManageModal({ ...showManageModal, location: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="btn-primary flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageModal(null)}
                  className="btn-secondary"
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
