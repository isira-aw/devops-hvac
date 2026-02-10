import { useState, useEffect } from 'react';
import { Thermometer, Droplets, Zap, TrendingUp, Settings, Bell, Monitor } from 'lucide-react';

function LiveDashboardTemplate() {
  const [systemPower, setSystemPower] = useState(true);
  const [mode, setMode] = useState<'cooling' | 'heating'>('cooling');
  const [fanSpeed, setFanSpeed] = useState<'low' | 'med' | 'high'>('low');
  const [temperature, setTemperature] = useState(24);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const generateChartData = () => {
    const points = 50;
    const data = [];
    for (let i = 0; i < points; i++) {
      data.push({
        x: i,
        y1: 22 + Math.sin(i * 0.3) * 1.5 + Math.random() * 0.5,
        y2: 22.5 + Math.cos(i * 0.25) * 1.8 + Math.random() * 0.5
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const minY = 20;
  const maxY = 24;
  const chartHeight = 200;
  const chartWidth = 700;

  const getYPosition = (value: number) => {
    return chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
  };

  const createPath = (data: typeof chartData, lineKey: 'y1' | 'y2') => {
    return data
      .map((point, index) => {
        const x = (point.x / (data.length - 1)) * chartWidth;
        const y = getYPosition(point[lineKey]);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Room Temp</p>
                <p className="text-3xl font-bold text-gray-900">20.7°C</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Humidity</p>
                <p className="text-3xl font-bold text-gray-900">64.2%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Power</p>
                <p className="text-3xl font-bold text-gray-900">111.9W</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Energy</p>
                <p className="text-3xl font-bold text-gray-900">0.7 kWh</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 text-gray-900">
                <Settings className="w-5 h-5" />
                <h2 className="text-xl font-bold">Control Panel</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">System Power</span>
                  <button
                    onClick={() => setSystemPower(!systemPower)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      systemPower ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                        systemPower ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode('cooling')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        mode === 'cooling'
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      COOLING
                    </button>
                    <button
                      onClick={() => setMode('heating')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        mode === 'heating'
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ☀ HEATING
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Fan Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFanSpeed('low')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        fanSpeed === 'low'
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      LOW
                    </button>
                    <button
                      onClick={() => setFanSpeed('med')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        fanSpeed === 'med'
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      MED
                    </button>
                    <button
                      onClick={() => setFanSpeed('high')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        fanSpeed === 'high'
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      HIGH
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-gray-700 font-medium">
                    Temperature Setpoint: {temperature}°C
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTemperature(Math.max(16, temperature - 1))}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="16"
                      max="30"
                      value={temperature}
                      onChange={(e) => setTemperature(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                    />
                    <button
                      onClick={() => setTemperature(Math.min(30, temperature + 1))}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-blue-500 rounded-lg flex-1">
                <Bell className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Last Update Time: {currentTime ? formatTime(currentTime) : '--'}
                </span>
              </div>
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                <Monitor className="w-5 h-5" />
                View Historical Data & Predictions
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Temperature History</h3>
              <div className="overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full"
                  style={{ minHeight: '300px' }}
                >
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[20, 21, 22, 23, 24].map((value) => (
                    <g key={value}>
                      <line
                        x1="0"
                        y1={getYPosition(value)}
                        x2={chartWidth}
                        y2={getYPosition(value)}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="-5"
                        y={getYPosition(value)}
                        fill="#9ca3af"
                        fontSize="12"
                        textAnchor="end"
                        dominantBaseline="middle"
                      >
                        {value}
                      </text>
                    </g>
                  ))}

                  <path
                    d={`${createPath(chartData, 'y1')} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                    fill="url(#gradient1)"
                  />
                  <path
                    d={createPath(chartData, 'y1')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />

                  <path
                    d={`${createPath(chartData, 'y2')} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                    fill="url(#gradient2)"
                  />
                  <path
                    d={createPath(chartData, 'y2')}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-600">Sensor 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-gray-600">Sensor 2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveDashboardTemplate;

