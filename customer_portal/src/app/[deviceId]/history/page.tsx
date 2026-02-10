'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { customerApi } from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

// Full telemetry data interface matching backend
interface TelemetryData {
  timestamp: string;
  // Environmental
  supplyAirTemp: number | null;
  returnAirTemp: number | null;
  roomTemp: number | null;
  humidity: number | null;
  outdoorTemp: number | null;
  // Electrical
  lineVoltage: number | null;
  currentAmps: number | null;
  powerWatts: number | null;
  energyKwh: number | null;
  // Mechanical
  compressorOn: boolean | null;
  fanSpeed: string | null;
  airflowStatus: string | null;
  filterCondition: string | null;
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  location: string;
  online: boolean;
  systemOn: boolean;
  mode: string;
}

// Backend prediction response interface
interface BackendPrediction {
  deviceId: string;
  estimatedRuntime: number;
  dailyEnergyPrediction: number;
  monthlyEnergyPrediction: number;
  efficiencyScore: number;
  maintenanceRecommendation: string;
}

// Column definition for dynamic selection
interface ColumnDefinition {
  key: keyof TelemetryData;
  label: string;
  unit: string;
  category: 'environmental' | 'electrical' | 'mechanical';
  format: (value: any) => string;
}

// All available columns
const ALL_COLUMNS: ColumnDefinition[] = [
  // Environmental
  { key: 'supplyAirTemp', label: 'Supply Air Temp', unit: '°C', category: 'environmental', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'returnAirTemp', label: 'Return Air Temp', unit: '°C', category: 'environmental', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'roomTemp', label: 'Room Temp', unit: '°C', category: 'environmental', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'humidity', label: 'Humidity', unit: '%', category: 'environmental', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'outdoorTemp', label: 'Outdoor Temp', unit: '°C', category: 'environmental', format: (v) => v?.toFixed(1) || 'N/A' },
  // Electrical
  { key: 'lineVoltage', label: 'Line Voltage', unit: 'V', category: 'electrical', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'currentAmps', label: 'Current', unit: 'A', category: 'electrical', format: (v) => v?.toFixed(2) || 'N/A' },
  { key: 'powerWatts', label: 'Power', unit: 'W', category: 'electrical', format: (v) => v?.toFixed(1) || 'N/A' },
  { key: 'energyKwh', label: 'Energy', unit: 'kWh', category: 'electrical', format: (v) => v?.toFixed(2) || 'N/A' },
  // Mechanical
  { key: 'compressorOn', label: 'Compressor', unit: '', category: 'mechanical', format: (v) => v === null ? 'N/A' : v ? 'ON' : 'OFF' },
  { key: 'fanSpeed', label: 'Fan Speed', unit: '', category: 'mechanical', format: (v) => v || 'N/A' },
  { key: 'airflowStatus', label: 'Airflow Status', unit: '', category: 'mechanical', format: (v) => v || 'N/A' },
  { key: 'filterCondition', label: 'Filter Condition', unit: '', category: 'mechanical', format: (v) => v || 'N/A' },
];

// Default selected columns (Temperature & Energy only as per original requirement)
const DEFAULT_SELECTED_COLUMNS: (keyof TelemetryData)[] = [
  'supplyAirTemp', 'returnAirTemp', 'roomTemp', 'powerWatts', 'energyKwh'
];

export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params.deviceId as string;
  const { isAuthenticated, isLoading } = useAuth();

  // Historical data state (date range dependent)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Current state (always up-to-date, independent of date range)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null);
  const [predictions, setPredictions] = useState<BackendPrediction | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  // Date range state (only for historical data)
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 16);
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });

  // Selection state for table rows
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Column selection state
  const [selectedColumns, setSelectedColumns] = useState<Set<keyof TelemetryData>>(
    new Set(DEFAULT_SELECTED_COLUMNS)
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get selected column definitions in order
  const getSelectedColumnDefs = useCallback(() => {
    return ALL_COLUMNS.filter(col => selectedColumns.has(col.key));
  }, [selectedColumns]);

  // Toggle column selection
  const toggleColumn = (key: keyof TelemetryData) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedColumns(newSelected);
  };

  // Select/deselect all columns in a category
  const toggleCategory = (category: 'environmental' | 'electrical' | 'mechanical') => {
    const categoryColumns = ALL_COLUMNS.filter(col => col.category === category);
    const allSelected = categoryColumns.every(col => selectedColumns.has(col.key));

    const newSelected = new Set(selectedColumns);
    categoryColumns.forEach(col => {
      if (allSelected) {
        newSelected.delete(col.key);
      } else {
        newSelected.add(col.key);
      }
    });
    setSelectedColumns(newSelected);
  };

  // Load current predictions and device status (always up-to-date)
  const loadCurrentData = useCallback(async () => {
    try {
      const [statusRes, predictionsRes] = await Promise.all([
        customerApi.getDeviceStatus(deviceId),
        customerApi.getPredictions(deviceId),
      ]);

      // Device info
      setDeviceInfo({
        deviceId: statusRes.data.device.deviceId,
        deviceName: statusRes.data.device.deviceName,
        location: statusRes.data.device.location,
        online: statusRes.data.device.online,
        systemOn: statusRes.data.device.systemOn,
        mode: statusRes.data.device.mode,
      });

      // Latest telemetry
      if (statusRes.data.telemetry) {
        setLatestTelemetry(statusRes.data.telemetry);
      }

      // Backend predictions (always current)
      setPredictions(predictionsRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('You do not have access to this device');
        router.push('/dashboard');
      }
    }
  }, [deviceId, router]);

  // Load historical data (date range dependent)
  const loadHistoricalData = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const historyRes = await customerApi.getTelemetryHistory(deviceId, fromDate, toDate);

      // Map all telemetry data fields
      const fullData: TelemetryData[] = (historyRes.data || []).map((item: any) => ({
        timestamp: item.timestamp,
        supplyAirTemp: item.supplyAirTemp,
        returnAirTemp: item.returnAirTemp,
        roomTemp: item.roomTemp,
        humidity: item.humidity,
        outdoorTemp: item.outdoorTemp,
        lineVoltage: item.lineVoltage,
        currentAmps: item.currentAmps,
        powerWatts: item.powerWatts,
        energyKwh: item.energyKwh,
        compressorOn: item.compressorOn,
        fanSpeed: item.fanSpeed,
        airflowStatus: item.airflowStatus,
        filterCondition: item.filterCondition,
      }));

      setTelemetryHistory(fullData);
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (err: any) {
      console.error('Failed to load historical data:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [deviceId, fromDate, toDate]);

  // Initial load
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const init = async () => {
        setInitialLoading(true);
        await loadCurrentData();
        await loadHistoricalData();
        setInitialLoading(false);
      };
      init();
    }
  }, [isAuthenticated, loadCurrentData, loadHistoricalData]);

  // Auto-refresh predictions every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadCurrentData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadCurrentData]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(telemetryHistory.map((_, index) => index)));
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === telemetryHistory.length);
  };

  // Get efficiency rating label
  const getEfficiencyLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 50) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  // Calculate estimated monthly cost
  const getEstimatedMonthlyCost = (monthlyKwh: number, rate = 0.12): number => {
    return monthlyKwh * rate;
  };

  const exportToPDF = async () => {
    if (selectedColumns.size === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      const selectedColDefs = getSelectedColumnDefs();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(9, 65, 102);
      doc.text('HVAC Historical Data Report', 14, 22);

      // Device info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Device: ${deviceInfo?.deviceName || deviceId}`, 14, 35);
      doc.text(`Location: ${deviceInfo?.location || 'N/A'}`, 14, 42);
      doc.text(`Period: ${new Date(fromDate).toLocaleString()} - ${new Date(toDate).toLocaleString()}`, 14, 49);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 56);

      // Selected columns info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Columns: ${selectedColDefs.map(c => c.label).join(', ')}`, 14, 63);

      // Get data to export (selected rows or all)
      const dataToExport = selectedRows.size > 0
        ? telemetryHistory.filter((_, index) => selectedRows.has(index))
        : telemetryHistory;

      // Build table headers and data based on selected columns
      const headers = ['Timestamp', ...selectedColDefs.map(col => `${col.label}${col.unit ? ` (${col.unit})` : ''}`)];

      const tableData = dataToExport.map(item => [
        new Date(item.timestamp + 'Z').toLocaleString(),
        ...selectedColDefs.map(col => col.format(item[col.key]))
      ]);

      // Create table
      autoTable(doc, {
        startY: 70,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [9, 65, 102],
          textColor: 255,
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 35 },
        },
      });

      // Add current predictions summary
      if (predictions) {
        const finalY = (doc as any).lastAutoTable.finalY || 70;
        const efficiency = getEfficiencyLabel(predictions.efficiencyScore);

        // Check if we need a new page
        if (finalY > 200) {
          doc.addPage();
          addPredictionSection(doc, 20);
        } else {
          addPredictionSection(doc, finalY + 15);
        }
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 14, 290);
        doc.text('Generated by HVAC Control System', 150, 290);
      }

      // Save
      const fileName = `hvac_history_${deviceId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Helper function to add prediction section to PDF
  const addPredictionSection = (doc: jsPDF, startY: number) => {
    if (!predictions) return;

    doc.setFontSize(14);
    doc.setTextColor(9, 65, 102);
    doc.text('Current Predictions & Analysis', 14, startY);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const efficiency = getEfficiencyLabel(predictions.efficiencyScore);
    const monthlyCost = getEstimatedMonthlyCost(predictions.monthlyEnergyPrediction);

    const predictionLines = [
      `Efficiency Score: ${predictions.efficiencyScore.toFixed(0)}% (${efficiency.label})`,
      `Estimated Runtime: ${predictions.estimatedRuntime.toFixed(1)} hours`,
      `Daily Energy Prediction: ${predictions.dailyEnergyPrediction.toFixed(2)} kWh`,
      `Monthly Energy Prediction: ${predictions.monthlyEnergyPrediction.toFixed(2)} kWh`,
      `Estimated Monthly Cost: $${monthlyCost.toFixed(2)} (at $0.12/kWh)`,
      `Maintenance: ${predictions.maintenanceRecommendation}`,
    ];

    let yPos = startY + 10;
    predictionLines.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += 7;
    });
  };

  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <i className="lni lni-spinner-arrow text-4xl text-primary animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const selectedColDefs = getSelectedColumnDefs();
  const efficiency = predictions ? getEfficiencyLabel(predictions.efficiencyScore) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <button onClick={() => router.push(`/${deviceId}`)} className="hover:opacity-75" title="Back to Device">
              <i className="lni lni-arrow-left text-xl"></i>
            </button>
            <span className="text-lg md:text-xl font-bold">Smart HVAC</span>

            <div className="border-l border-white/30 pl-3 md:pl-4 hidden sm:block">
              <h1 className="text-base md:text-xl font-bold">Historical Data</h1>
              <p className="text-xs md:text-sm opacity-75">{deviceInfo?.deviceName || deviceId}</p>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="px-2 py-2 hover:bg-white/10 rounded text-center">
              Dashboard
            </Link>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${deviceInfo?.online ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${deviceInfo?.online ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{deviceInfo?.online ? 'Online' : 'Offline'}</span>
            </div>

            <button
              onClick={exportToPDF}
              disabled={exporting || telemetryHistory.length === 0 || selectedColumns.size === 0}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <i className="lni lni-spinner-arrow animate-spin"></i>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <i className="lni lni-download"></i>
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <Link href="/" className=" text-white px-4 py-2 rounded-lg hover:bg-white/10">
              <i className="lni lni-home text-xl md:text-2xl"></i>
            </Link>
          </div>

          {/* Mobile - Status and hamburger */}
          <div className="flex md:hidden items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${deviceInfo?.online ? 'bg-green-400' : 'bg-red-400'}`}></div>
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
              <div className="px-2">
                <h1 className="text-base font-bold">Historical Data</h1>
                <p className="text-xs opacity-75">{deviceInfo?.deviceName || deviceId}</p>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-sm">Device Status</span>
                <span className={`text-sm ${deviceInfo?.online ? 'text-green-300' : 'text-red-300'}`}>
                  {deviceInfo?.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <Link href="/dashboard" className="px-2 py-2 hover:bg-white/10 rounded text-center">
                Dashboard
              </Link>
              <button
                onClick={exportToPDF}
                disabled={exporting || telemetryHistory.length === 0 || selectedColumns.size === 0}
                className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <i className="lni lni-spinner-arrow animate-spin"></i>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <i className="lni lni-download"></i>
                    <span>Export PDF</span>
                  </>
                )}
              </button>
              <Link href="/" className="px-2 py-2 hover:bg-white/10 rounded text-center">
                <i className="lni lni-home text-xl md:text-2xl"></i>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Mobile: Full width stacked layout. Desktop: 3-column grid */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
          {/* Predictions Panel - Full width first on mobile, left column on desktop */}
          <div className="w-full lg:col-span-1 lg:row-span-2">
            <div className="card lg:sticky lg:top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <i className="lni lni-graph mr-2 text-primary"></i>
                  Predictions & Analysis
                </h2>
                <span className="text-xs text-gray-500 flex items-center">
                  <i className="lni lni-reload mr-1"></i>
                  Live
                </span>
              </div>

              {predictions ? (
                <div className="space-y-5">
                  {/* Current Status */}
                  {latestTelemetry && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <i className="lni lni-pulse mr-2 text-primary"></i>
                        Current Status
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Room Temp</span>
                          <p className="font-semibold">{latestTelemetry.roomTemp?.toFixed(1) || 'N/A'}°C</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Power</span>
                          <p className="font-semibold">{latestTelemetry.powerWatts?.toFixed(0) || 'N/A'} W</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Humidity</span>
                          <p className="font-semibold">{latestTelemetry.humidity?.toFixed(0) || 'N/A'}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Energy</span>
                          <p className="font-semibold">{latestTelemetry.energyKwh?.toFixed(2) || 'N/A'} kWh</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Efficiency Score */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <i className="lni lni-checkmark-circle mr-2 text-purple-500"></i>
                      Efficiency Score
                    </h3>
                    <div className={`rounded-lg p-4 text-center ${efficiency?.color}`}>
                      <div className="text-4xl font-bold">{predictions.efficiencyScore.toFixed(0)}%</div>
                      <div className="text-lg font-semibold mt-1">{efficiency?.label}</div>
                      <p className="text-xs mt-2 opacity-75">
                        Based on temperature delta, filter condition, airflow & power factor
                      </p>
                    </div>
                  </div>

                  {/* Runtime Prediction */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <i className="lni lni-timer mr-2 text-blue-500"></i>
                      Runtime Estimate
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Estimated Runtime</span>
                        <span className="text-2xl font-bold text-blue-700">
                          {predictions.estimatedRuntime.toFixed(1)} hrs
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on current load and remaining capacity
                      </p>
                    </div>
                  </div>

                  {/* Energy Predictions */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <i className="lni lni-bolt mr-2 text-yellow-500"></i>
                      Energy Predictions
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Daily Prediction</span>
                        <span className="font-semibold">{predictions.dailyEnergyPrediction.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monthly Prediction</span>
                        <span className="font-semibold">{predictions.monthlyEnergyPrediction.toFixed(2)} kWh</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Monthly Cost</span>
                          <span className="font-bold text-green-700">
                            ${getEstimatedMonthlyCost(predictions.monthlyEnergyPrediction).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">at $0.12/kWh average rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Recommendation */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <i className="lni lni-cog mr-2 text-orange-500"></i>
                      Maintenance
                    </h3>
                    <div className={`rounded-lg p-3 ${predictions.efficiencyScore >= 70 ? 'bg-green-50 border border-green-200' :
                        predictions.efficiencyScore >= 50 ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-red-50 border border-red-200'
                      }`}>
                      <p className="text-sm">{predictions.maintenanceRecommendation}</p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-400 border-t pt-3 flex items-center justify-between">
                    <span>Auto-refreshes every 30 seconds</span>
                    <button
                      onClick={loadCurrentData}
                      className="text-primary hover:underline flex items-center"
                    >
                      <i className="lni lni-reload mr-1"></i>
                      Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="lni lni-graph text-4xl mb-2"></i>
                  <p>No prediction data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Historical Data Section - Full width second on mobile, right columns on desktop */}
          <div className="w-full lg:col-span-2 space-y-6">
            {/* Date Range Selection */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <i className="lni lni-calendar mr-2 text-primary"></i>
                Historical Data Range
              </h2>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">From</label>
                  <input
                    type="datetime-local"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">To</label>
                  <input
                    type="datetime-local"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button
                  onClick={loadHistoricalData}
                  disabled={historyLoading}
                  className="btn-primary px-6 py-2 flex items-center"
                >
                  {historyLoading ? (
                    <>
                      <i className="lni lni-spinner-arrow animate-spin mr-2"></i>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="lni lni-reload mr-2"></i>
                      Load Data
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Column Selection Card */}
            <div className="card">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center">
                  <i className="lni lni-columns mr-2 text-primary"></i>
                  Select Columns
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({selectedColumns.size} of {ALL_COLUMNS.length} selected)
                  </span>
                </h2>
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="text-primary hover:text-primary/80 flex items-center text-sm"
                >
                  {showColumnSelector ? (
                    <>
                      <i className="lni lni-chevron-up mr-1"></i>
                      Hide
                    </>
                  ) : (
                    <>
                      <i className="lni lni-chevron-down mr-1"></i>
                      Expand
                    </>
                  )}
                </button>
              </div>

              {showColumnSelector && (
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  {/* Environmental */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-700 flex items-center text-sm">
                        <i className="lni lni-leaf mr-1"></i>
                        Environmental
                      </h3>
                      <button
                        onClick={() => toggleCategory('environmental')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {ALL_COLUMNS.filter(c => c.category === 'environmental').every(c => selectedColumns.has(c.key)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ALL_COLUMNS.filter(col => col.category === 'environmental').map(col => (
                        <label key={col.key} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedColumns.has(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                          />
                          <span>{col.label}</span>
                          {col.unit && <span className="text-gray-400 ml-1">({col.unit})</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Electrical */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-yellow-700 flex items-center text-sm">
                        <i className="lni lni-bolt mr-1"></i>
                        Electrical
                      </h3>
                      <button
                        onClick={() => toggleCategory('electrical')}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        {ALL_COLUMNS.filter(c => c.category === 'electrical').every(c => selectedColumns.has(c.key)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ALL_COLUMNS.filter(col => col.category === 'electrical').map(col => (
                        <label key={col.key} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedColumns.has(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                          />
                          <span>{col.label}</span>
                          {col.unit && <span className="text-gray-400 ml-1">({col.unit})</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mechanical */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-700 flex items-center text-sm">
                        <i className="lni lni-cog mr-1"></i>
                        Mechanical
                      </h3>
                      <button
                        onClick={() => toggleCategory('mechanical')}
                        className="text-xs text-green-600 hover:underline"
                      >
                        {ALL_COLUMNS.filter(c => c.category === 'mechanical').every(c => selectedColumns.has(c.key)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ALL_COLUMNS.filter(col => col.category === 'mechanical').map(col => (
                        <label key={col.key} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedColumns.has(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                          />
                          <span>{col.label}</span>
                          {col.unit && <span className="text-gray-400 ml-1">({col.unit})</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick summary of selected columns when collapsed */}
              {!showColumnSelector && selectedColumns.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedColDefs.map(col => (
                    <span
                      key={col.key}
                      className={`text-xs px-2 py-1 rounded-full ${col.category === 'environmental' ? 'bg-blue-100 text-blue-700' :
                          col.category === 'electrical' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}
                    >
                      {col.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Data Table Card */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <i className="lni lni-list mr-2 text-primary"></i>
                  Historical Data
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({telemetryHistory.length} records)
                  </span>
                </h2>
                {selectedRows.size > 0 && (
                  <span className="text-sm text-primary">
                    {selectedRows.size} rows selected for export
                  </span>
                )}
              </div>

              {selectedColumns.size === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="lni lni-warning text-4xl mb-2"></i>
                  <p>Please select at least one column to display</p>
                </div>
              ) : historyLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="lni lni-spinner-arrow text-4xl animate-spin mb-2"></i>
                  <p>Loading historical data...</p>
                </div>
              ) : telemetryHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-3 text-left sticky left-0 bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Timestamp</th>
                        {selectedColDefs.map(col => (
                          <th key={col.key} className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                            {col.label}
                            {col.unit && <span className="text-gray-400 font-normal ml-1">({col.unit})</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {telemetryHistory.map((item, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedRows.has(index) ? 'bg-primary/5' : ''}`}
                          onClick={() => handleRowSelect(index)}
                        >
                          <td className="px-3 py-2 sticky left-0 bg-white">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index)}
                              onChange={() => handleRowSelect(index)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {new Date(item.timestamp + 'Z').toLocaleString()}
                          </td>
                          {selectedColDefs.map(col => (
                            <td key={col.key} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                              {col.format(item[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <i className="lni lni-files text-4xl mb-2"></i>
                  <p>No historical data found for the selected period</p>
                  <p className="text-sm mt-1">Try adjusting the date range</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
