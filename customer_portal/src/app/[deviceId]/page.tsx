'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { customerApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from 'next/link';

interface DeviceStatus {
  device: {
    deviceId: string;
    deviceName: string;
    location: string;
    online: boolean;
    systemOn: boolean;
    mode: string;
    fanSpeed: string;
    temperatureSetpoint: number;
  };
  telemetry: {
    supplyAirTemp: number | null;
    returnAirTemp: number | null;
    roomTemp: number | null;
    humidity: number | null;
    outdoorTemp: number | null;
    lineVoltage: number | null;
    currentAmps: number | null;
    powerWatts: number | null;
    energyKwh: number | null;
    compressorOn: boolean | null;
    fanSpeed: string | null;
    airflowStatus: string | null;
    filterCondition: string | null;
    timestamp: string | null;
  };
}

interface TelemetryHistory {
  timestamp: string;
  supplyAirTemp: number;
  returnAirTemp: number;
  powerWatts: number;
  energyKwh: number;
}

interface Fault {
  id: number;
  faultType: string;
  description: string;
  severity: string;
  createdAt: string;
  resolved: boolean;
}

interface Prediction {
  estimatedRuntime: number;
  dailyEnergyPrediction: number;
  monthlyEnergyPrediction: number;
  efficiencyScore: number;
  maintenanceRecommendation: string;
}

export default function DeviceDashboard() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params.deviceId as string;
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistory[]>([]);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);

  // Control states
  const [systemOn, setSystemOn] = useState(false);
  const [mode, setMode] = useState('COOLING');
  const [fanSpeed, setFanSpeed] = useState('MED');
  const [temperatureSetpoint, setTemperatureSetpoint] = useState(24);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pending changes states for Control Panel
  const [pendingSystemOn, setPendingSystemOn] = useState<boolean | null>(null);
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const [pendingFanSpeed, setPendingFanSpeed] = useState<string | null>(null);
  const [pendingTempSetpoint, setPendingTempSetpoint] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statusRes, telemetryRes, faultsRes, predictionsRes] = await Promise.all([
        customerApi.getDeviceStatus(deviceId),
        customerApi.getTelemetry(deviceId, 50),
        customerApi.getFaults(deviceId, 0, 10),
        customerApi.getPredictions(deviceId),
      ]);

      setStatus(statusRes.data);
      setTelemetryHistory(telemetryRes.data.reverse());
      setFaults(faultsRes.data.content || []);
      setPredictions(predictionsRes.data);

      // Update control states from device status
      const device = statusRes.data.device;
      setSystemOn(device.systemOn);
      setMode(device.mode);
      setFanSpeed(device.fanSpeed);
      setTemperatureSetpoint(device.temperatureSetpoint);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('You do not have access to this device');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [deviceId, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadData]);

  const sendControl = async (updates: {
    systemOn?: boolean;
    mode?: string;
    fanSpeed?: string;
    temperatureSetpoint?: number;
  }) => {
    setControlLoading(true);
    try {
      await customerApi.sendControl(deviceId, updates);
      // Update local state
      if (updates.systemOn !== undefined) setSystemOn(updates.systemOn);
      if (updates.mode) setMode(updates.mode);
      if (updates.fanSpeed) setFanSpeed(updates.fanSpeed);
      if (updates.temperatureSetpoint) setTemperatureSetpoint(updates.temperatureSetpoint);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send control command');
    } finally {
      setControlLoading(false);
    }
  };

  // Check if there are any pending changes
  const hasPendingChanges = pendingSystemOn !== null || pendingMode !== null ||
    pendingFanSpeed !== null || pendingTempSetpoint !== null;

  // Get display values (pending or current)
  const displaySystemOn = pendingSystemOn !== null ? pendingSystemOn : systemOn;
  const displayMode = pendingMode !== null ? pendingMode : mode;
  const displayFanSpeed = pendingFanSpeed !== null ? pendingFanSpeed : fanSpeed;
  const displayTempSetpoint = pendingTempSetpoint !== null ? pendingTempSetpoint : temperatureSetpoint;

  // Handle pending change for each control
  const setPendingChange = (type: string, value: any) => {
    switch (type) {
      case 'systemOn':
        setPendingSystemOn(value !== systemOn ? value : null);
        break;
      case 'mode':
        setPendingMode(value !== mode ? value : null);
        break;
      case 'fanSpeed':
        setPendingFanSpeed(value !== fanSpeed ? value : null);
        break;
      case 'temperatureSetpoint':
        setPendingTempSetpoint(value !== temperatureSetpoint ? value : null);
        break;
    }
  };

  // Discard all pending changes
  const discardChanges = () => {
    setPendingSystemOn(null);
    setPendingMode(null);
    setPendingFanSpeed(null);
    setPendingTempSetpoint(null);
  };

  // Apply pending changes with loading animation
  const applyChanges = async () => {
    setIsUpdating(true);
    setUpdateMessage('Updating the changes');

    // First 3 seconds - "Updating the changes"
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Next 7 seconds - "Updating the database"
    setUpdateMessage('Updating the database');

    // Build the updates object
    const updates: {
      systemOn?: boolean;
      mode?: string;
      fanSpeed?: string;
      temperatureSetpoint?: number;
    } = {};

    if (pendingSystemOn !== null) updates.systemOn = pendingSystemOn;
    if (pendingMode !== null) updates.mode = pendingMode;
    if (pendingFanSpeed !== null) updates.fanSpeed = pendingFanSpeed;
    if (pendingTempSetpoint !== null) updates.temperatureSetpoint = pendingTempSetpoint;

    // Wait remaining 7 seconds while making API call
    const [apiResult] = await Promise.all([
      customerApi.sendControl(deviceId, updates).then(() => true).catch((err: any) => {
        alert(err.response?.data?.error || 'Failed to send control command');
        return false;
      }),
      new Promise(resolve => setTimeout(resolve, 7000))
    ]);

    if (apiResult) {
      // Update local state on success
      if (pendingSystemOn !== null) setSystemOn(pendingSystemOn);
      if (pendingMode !== null) setMode(pendingMode);
      if (pendingFanSpeed !== null) setFanSpeed(pendingFanSpeed);
      if (pendingTempSetpoint !== null) setTemperatureSetpoint(pendingTempSetpoint);
    }

    // Clear pending changes
    discardChanges();
    setIsUpdating(false);
    setUpdateMessage('');
  };

  const formatValue = (value: any, unit = '') => {
    if (value === null || value === undefined) return 'N/C';
    return `${typeof value === 'number' ? value.toFixed(1) : value}${unit}`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <i className="lni lni-spinner-arrow text-4xl text-primary animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading device data...</p>
        </div>
      </div>
    );
  }

  const telemetry = status?.telemetry || {} as DeviceStatus['telemetry'];
  const device = status?.device;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

          {/* Left side - Navigation */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <span className="text-lg md:text-xl font-bold">Smart HVAC</span>

            <div className="border-l border-white/30 pl-3 md:pl-4">
              <h1 className="text-base md:text-xl font-bold truncate max-w-[120px] sm:max-w-none">{device?.deviceName || deviceId}</h1>
              <p className="text-xs md:text-sm opacity-75 hidden sm:block">{device?.location}</p>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="px-2 py-2 hover:bg-white/10 rounded text-center">
              Dashboard
            </Link>
            {user ? (
              <span className="px-2 py-2 font-medium text-center">
                {user.username}
              </span>
            ) : (
              <Link
                href="/login"
                className="hover:bg-white/10 px-2 py-2 rounded text-center"
              >
                Login
              </Link>
            )}
            <div className={`flex items-center space-x-2 ${device?.online ? 'text-green-300' : 'text-red-300'}`}>
              <div className={`w-3 h-3 rounded-full ${device?.online ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{device?.online ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="bg-white text-primary px-4 py-1 rounded hover:bg-gray-100"
            >
              Logout
            </button>
            <Link href="/" className=" text-white px-4 py-2 rounded-lg hover:bg-white/10">
              <i className="lni lni-home text-xl md:text-2xl"></i>
            </Link>
          </div>

          {/* Mobile - Status indicator and hamburger */}
          <div className="flex md:hidden items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${device?.online ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <button
              className="p-2 hover:opacity-75"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`lni ${mobileMenuOpen ? 'lni-close' : 'lni-menu'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm opacity-75">{device?.location}</span>
                <span className={`text-sm ${device?.online ? 'text-green-300' : 'text-red-300'}`}>
                  {device?.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <Link href="/dashboard" className="px-2 py-2 hover:bg-white/10 rounded text-center">
                Dashboard
              </Link>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="lni lni-thermometer text-xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room Temp</p>
                <p className="text-2xl font-bold">{formatValue(telemetry.roomTemp, '°C')}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="lni lni-drop text-xl text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Humidity</p>
                <p className="text-2xl font-bold">{formatValue(telemetry.humidity, '%')}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="lni lni-bolt text-xl text-yellow-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Power</p>
                <p className="text-2xl font-bold">{formatValue(telemetry.powerWatts, 'W')}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="lni lni-stats-up text-xl text-purple-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Energy</p>
                <p className="text-2xl font-bold">{formatValue(telemetry.energyKwh, ' kWh')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls & Environmental */}
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="card relative overflow-hidden">
              {/* Loading Overlay */}
              {isUpdating && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-xl">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">{updateMessage}</p>
                </div>
              )}

              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <i className="lni lni-cog mr-2 text-primary"></i>
                Control Panel
              </h2>

              <div className="space-y-4">
                {/* Power Toggle */}
                <div className="flex justify-between items-center">
                  <span>System Power</span>
                  <button
                    onClick={() => setPendingChange('systemOn', !displaySystemOn)}
                    disabled={controlLoading || isUpdating}
                    className={`w-16 h-8 rounded-full relative transition-colors ${displaySystemOn ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${displaySystemOn ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mode</label>
                  <div className="flex space-x-2">
                    {['COOLING', 'HEATING'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPendingChange('mode', m)}
                        disabled={controlLoading || isUpdating}
                        className={`flex-1 py-2 rounded-lg transition-colors ${displayMode === m ? 'bg-primary text-white' : 'bg-gray-200'}`}
                      >
                        {m === 'COOLING' ? <i className="lni lni-snowflake"></i> : <i className="lni lni-sun"></i>}
                        <span className="ml-1">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fan Speed */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fan Speed</label>
                  <div className="flex space-x-2">
                    {['LOW', 'MED', 'HIGH'].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPendingChange('fanSpeed', speed)}
                        disabled={controlLoading || isUpdating}
                        className={`flex-1 py-2 rounded-lg transition-colors ${displayFanSpeed === speed ? 'bg-primary text-white' : 'bg-gray-200'}`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature Setpoint */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Temperature Setpoint: {displayTempSetpoint}°C
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setPendingChange('temperatureSetpoint', displayTempSetpoint - 1)}
                      disabled={controlLoading || isUpdating || displayTempSetpoint <= 16}
                      className="btn-secondary w-10 h-10"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="16"
                      max="30"
                      value={displayTempSetpoint}
                      onChange={(e) => setPendingChange('temperatureSetpoint', Number(e.target.value))}
                      disabled={isUpdating}
                      className="
                        flex-1
                        accent-[#094166]
                        cursor-pointer
                      "
                    />
                    <button
                      onClick={() => setPendingChange('temperatureSetpoint', displayTempSetpoint + 1)}
                      disabled={controlLoading || isUpdating || displayTempSetpoint >= 30}
                      className="btn-secondary w-10 h-10"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Okay and Discard Buttons */}
                {hasPendingChanges && !isUpdating && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={discardChanges}
                      className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                      Discard Changes
                    </button>
                    <button
                      onClick={applyChanges}
                      className="flex-1 py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                    >
                      Okay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Environmental Data */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <i className="lni lni-leaf mr-2 text-primary"></i>
                Environmental
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supply Air Temp</span>
                  <span className="font-medium">{formatValue(telemetry.supplyAirTemp, '°C')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Air Temp</span>
                  <span className="font-medium">{formatValue(telemetry.returnAirTemp, '°C')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outdoor Temp</span>
                  <span className="font-medium">{formatValue(telemetry.outdoorTemp, '°C')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Filter Condition</span>
                  <span className={`font-medium ${telemetry.filterCondition === 'CLOGGED' ? 'text-red-500' : ''}`}>
                    {formatValue(telemetry.filterCondition)}
                  </span>
                </div>
              </div>
            </div>

            {/* Electrical Data */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <i className="lni lni-bolt mr-2 text-primary"></i>
                Electrical
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Voltage</span>
                  <span className="font-medium">{formatValue(telemetry.lineVoltage, 'V')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current</span>
                  <span className="font-medium">{formatValue(telemetry.currentAmps, 'A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compressor</span>
                  <span className={`font-medium ${telemetry.compressorOn ? 'text-green-600' : 'text-gray-400'}`}>
                    {telemetry.compressorOn ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Historical Data Button */}
            <div className="flex justify-end gap-2">
              <div className="flex items-center space-x-2 px-4 py-2 border-2 border-primary text-primary rounded-md hover:bg-blue-50 cursor-pointer transition">
                <i className="lni lni-alarm"></i>
                <span>Last Update Time : {telemetry.timestamp ? new Date(telemetry.timestamp + 'Z').toLocaleString() : 'N/A'}</span>
              </div>
              <button
                onClick={() => router.push(`/${deviceId}/history`)}
                className="btn-primary flex items-center space-x-2"
              >
                <i className="lni lni-files"></i>
                <span>View Historical Data & Predictions</span>
              </button>
            </div>

            {/* Temperature Chart */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Temperature History</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(val) => new Date(val + 'Z').toLocaleTimeString()}
                      fontSize={12}
                    />
                    <YAxis domain={['auto', 'auto']} fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) => new Date(val + 'Z').toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="supplyAirTemp"
                      stroke="#094166"
                      name="Supply"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="returnAirTemp"
                      stroke="#10b981"
                      name="Return"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Energy Chart */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Energy Consumption</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(val) => new Date(val + 'Z').toLocaleTimeString()}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) => new Date(val + 'Z').toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="powerWatts"
                      stroke="#8b5cf6"
                      fill="#c4b5fd"
                      name="Power (W)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Predictions & Faults */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Predictions */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="lni lni-graph mr-2 text-primary"></i>
                  Predictions
                </h2>
                {predictions ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Runtime Estimate</span>
                      <span className="font-medium">{predictions.estimatedRuntime.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Energy</span>
                      <span className="font-medium">{predictions.dailyEnergyPrediction.toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Energy</span>
                      <span className="font-medium">{predictions.monthlyEnergyPrediction.toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Efficiency Score</span>
                      <span className={`font-bold ${predictions.efficiencyScore >= 70 ? 'text-green-600' : predictions.efficiencyScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {predictions.efficiencyScore.toFixed(0)}%
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">{predictions.maintenanceRecommendation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No predictions available</p>
                )}
              </div>

              {/* Faults */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="lni lni-warning mr-2 text-primary"></i>
                  Recent Alerts
                </h2>
                {faults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {faults.map((fault) => (
                      <div
                        key={fault.id}
                        className={`p-2 rounded text-sm ${fault.severity === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : fault.severity === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        <div className="font-medium">{fault.faultType}</div>
                        <div className="text-xs opacity-75">{fault.description}</div>
                        <div className="text-xs opacity-50">
                          {new Date(fault.createdAt + 'Z').toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent alerts</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
