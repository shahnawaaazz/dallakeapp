import { useState, useEffect, useCallback } from 'react';
import {
  stations,
  getCurrentReadings,
  generateAlerts,
  generateHistory,
  getWaterQualityIndex,
  getWQICategory,
  type SensorReading,
  type AnomalyAlert,
} from './data/mockData';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, AlertTriangle, CheckCircle, Droplets, Thermometer,
  Wind, Eye, Zap, MapPin, Clock, ChevronRight, BarChart3,
  Shield, Wifi, WifiOff, Wrench, Bell, X, Info,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

type Tab = 'dashboard' | 'stations' | 'alerts' | 'transparency';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('DL-C1');
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [alertAck, setAlertAck] = useState<Set<string>>(new Set());
  const [showAlertToast, setShowAlertToast] = useState(false);

  const refreshData = useCallback(() => {
    const newReadings = getCurrentReadings();
    setReadings(newReadings);
    const newAlerts = generateAlerts(newReadings);
    setAlerts(newAlerts);
    setLastUpdate(new Date());
    if (newAlerts.length > 0) {
      setShowAlertToast(true);
      setTimeout(() => setShowAlertToast(false), 4000);
    }
  }, []);

  useEffect(() => {
    refreshData();
    setHistory(generateHistory(selectedStation, 24));
  }, []);

  useEffect(() => {
    setHistory(generateHistory(selectedStation, 24));
  }, [selectedStation]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const onlineStations = stations.filter(s => s.status === 'online').length;
  const totalStations = stations.length;

  const avgWQI = () => {
    const vals = Object.values(readings).map(getWaterQualityIndex);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const unacknowledgedAlerts = alerts.filter(a => !alertAck.has(a.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Alert Toast */}
      {showAlertToast && unacknowledgedAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-amber-950 border border-amber-700 rounded-lg p-4 shadow-2xl max-w-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-amber-200">
              {unacknowledgedAlerts.length} new alert{unacknowledgedAlerts.length > 1 ? 's' : ''} detected
            </span>
            <button onClick={() => setShowAlertToast(false)} className="ml-auto text-amber-400 hover:text-amber-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Dal Lake Water Quality Monitor</h1>
                <p className="text-xs text-slate-400">Srinagar, Jammu & Kashmir • ESP32 Sensor Network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-800">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300 font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
              { id: 'stations' as Tab, label: 'Stations', icon: MapPin },
              { id: 'alerts' as Tab, label: `Alerts${unacknowledgedAlerts.length > 0 ? ` (${unacknowledgedAlerts.length})` : ''}`, icon: Bell },
              { id: 'transparency' as Tab, label: 'Public Transparency', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            readings={readings}
            alerts={alerts}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            history={history}
            avgWQI={avgWQI()}
            onlineStations={onlineStations}
            totalStations={totalStations}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'stations' && (
          <StationsView readings={readings} alerts={alerts} />
        )}
        {activeTab === 'alerts' && (
          <AlertsView alerts={alerts} alertAck={alertAck} setAlertAck={setAlertAck} />
        )}
        {activeTab === 'transparency' && (
          <TransparencyView readings={readings} alerts={alerts} avgWQI={avgWQI()} />
        )}
      </main>
    </div>
  );
}

// ==================== DASHBOARD VIEW ====================
function DashboardView({
  readings, alerts, selectedStation, setSelectedStation, history, avgWQI, onlineStations, totalStations, setActiveTab,
}: {
  readings: Record<string, SensorReading>;
  alerts: AnomalyAlert[];
  selectedStation: string;
  setSelectedStation: (id: string) => void;
  history: SensorReading[];
  avgWQI: number;
  onlineStations: number;
  totalStations: number;
  setActiveTab: (tab: Tab) => void;
}) {
  const wqiCategory = getWQICategory(avgWQI);
  const selectedReading = readings[selectedStation];
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Network Status"
          value={`${onlineStations}/${totalStations}`}
          sub="stations online"
          icon={<Wifi className="w-5 h-5 text-emerald-400" />}
          color="emerald"
        />
        <StatCard
          label="Avg Water Quality Index"
          value={`${avgWQI}`}
          sub={wqiCategory.label}
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
          color="cyan"
        />
        <StatCard
          label="Active Alerts"
          value={`${alerts.length}`}
          sub={`${criticalAlerts.length} high/critical`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          color="amber"
        />
        <StatCard
          label="Sampling Interval"
          value="10s"
          sub="ESP32 → MQTT → Dashboard"
          icon={<Zap className="w-5 h-5 text-violet-400" />}
          color="violet"
        />
      </div>

      {/* WQI Gauge + Station Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Lake-Wide WQI Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={wqiCategory.color}
                  strokeWidth="8"
                  strokeDasharray={`${avgWQI * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{avgWQI}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wqiCategory.color }} />
              <span className="text-sm font-medium" style={{ color: wqiCategory.color }}>{wqiCategory.label}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 leading-relaxed">
              WQI is computed from pH, dissolved oxygen, turbidity, ammonia-nitrogen, and coliform count using weighted CPCB methodology.
            </p>
          </div>
        </div>

        {/* Station Map */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Monitoring Stations — Dal Lake</h3>
          <div className="relative bg-slate-800/50 rounded-lg overflow-hidden" style={{ minHeight: '280px' }}>
            <svg viewBox="0 0 500 300" className="w-full h-full" style={{ minHeight: '280px' }}>
              {/* Lake outline (simplified) */}
              <path
                d="M120,60 C180,40 320,35 380,55 C420,70 440,100 445,140 C450,180 430,220 400,245 C360,270 280,280 220,275 C160,270 110,250 90,220 C70,190 65,150 75,110 C85,80 100,65 120,60Z"
                fill="none"
                stroke="#0e7490"
                strokeWidth="2"
                opacity="0.5"
              />
              <path
                d="M120,60 C180,40 320,35 380,55 C420,70 440,100 445,140 C450,180 430,220 400,245 C360,270 280,280 220,275 C160,270 110,250 90,220 C70,190 65,150 75,110 C85,80 100,65 120,60Z"
                fill="#0e7490"
                opacity="0.1"
              />
              {/* Station markers */}
              {stations.map((station, i) => {
                const positions = [
                  { x: 350, y: 100 }, // Nishat
                  { x: 200, y: 70 },  // Hazratbal
                  { x: 260, y: 150 }, // Central
                  { x: 160, y: 230 }, // Brari Nambal
                  { x: 380, y: 160 }, // Gagribal
                  { x: 340, y: 220 }, // Nagin
                ];
                const pos = positions[i];
                const reading = readings[station.id];
                const wqi = reading ? getWaterQualityIndex(reading) : 0;
                const cat = getWQICategory(wqi);
                const isSelected = selectedStation === station.id;
                const isOnline = station.status === 'online';

                return (
                  <g key={station.id} onClick={() => setSelectedStation(station.id)} className="cursor-pointer">
                    {isSelected && (
                      <circle cx={pos.x} cy={pos.y} r="18" fill={cat.color} opacity="0.15">
                        <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={pos.x} cy={pos.y} r="8"
                      fill={isOnline ? cat.color : '#64748b'}
                      stroke={isSelected ? '#fff' : 'transparent'}
                      strokeWidth="2"
                    />
                    {!isOnline && (
                      <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
                    )}
                    <text x={pos.x} y={pos.y - 14} textAnchor="middle" className="text-[10px] fill-slate-300 font-medium">
                      {station.name}
                    </text>
                    <text x={pos.x} y={pos.y + 20} textAnchor="middle" className="text-[9px] fill-slate-500">
                      WQI: {wqi}
                    </text>
                  </g>
                );
              })}
              {/* Legend */}
              <g transform="translate(10, 260)">
                <text className="text-[9px] fill-slate-500">● Online</text>
                <circle cx="3" cy="-3" r="3" fill="#10b981" />
                <text x="40" className="text-[9px] fill-slate-500">◌ Maintenance</text>
                <circle cx="113" cy="-3" r="3" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2 1" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">
            24-Hour Trend — {stations.find(s => s.id === selectedStation)?.name}
          </h3>
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200"
          >
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-2">Dissolved Oxygen (mg/L)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).getHours() + ':00'} stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(l) => new Date(l).toLocaleString()}
                />
                <Area type="monotone" dataKey="dissolvedOxygen" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Turbidity (NTU)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).getHours() + ':00'} stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 12]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(l) => new Date(l).toLocaleString()}
                />
                <Area type="monotone" dataKey="turbidity" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current Readings Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Current Readings — All Parameters</h3>
        {selectedReading && <ParameterGrid reading={selectedReading} />}
      </div>

      {/* Recent Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">High Priority Alerts</h3>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map(alert => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STATIONS VIEW ====================
function StationsView({ readings, alerts }: { readings: Record<string, SensorReading>; alerts: AnomalyAlert[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Monitoring Stations</h2>
        <span className="text-xs text-slate-500">{stations.length} sensors deployed across Dal Lake</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map(station => {
          const reading = readings[station.id];
          const wqi = reading ? getWaterQualityIndex(reading) : 0;
          const cat = getWQICategory(wqi);
          const stationAlerts = alerts.filter(a => a.stationId === station.id);

          return (
            <div key={station.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white text-sm">{station.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{station.location}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                  station.status === 'online' ? 'bg-emerald-950 text-emerald-300' :
                  station.status === 'maintenance' ? 'bg-amber-950 text-amber-300' :
                  'bg-red-950 text-red-300'
                }`}>
                  {station.status === 'online' && <Wifi className="w-3 h-3" />}
                  {station.status === 'maintenance' && <Wrench className="w-3 h-3" />}
                  {station.status === 'offline' && <WifiOff className="w-3 h-3" />}
                  {station.status}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-14 h-14">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={cat.color}
                      strokeWidth="6"
                      strokeDasharray={`${wqi * 2.64} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{wqi}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Water Quality Index</p>
                  <p className="text-sm font-medium" style={{ color: cat.color }}>{cat.label}</p>
                </div>
              </div>

              {reading && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MiniStat label="pH" value={reading.ph.toFixed(2)} />
                  <MiniStat label="DO" value={`${reading.dissolvedOxygen.toFixed(1)} mg/L`} />
                  <MiniStat label="Turbidity" value={`${reading.turbidity.toFixed(1)} NTU`} />
                  <MiniStat label="Temp" value={`${reading.temperature.toFixed(1)}°C`} />
                  <MiniStat label="NH₃-N" value={`${reading.ammoniaNitrogen.toFixed(2)} mg/L`} />
                  <MiniStat label="Coliform" value={`${Math.round(reading.coliformCount)} MPN`} />
                </div>
              )}

              {stationAlerts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400">{stationAlerts.length} active alert{stationAlerts.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== ALERTS VIEW ====================
function AlertsView({ alerts, alertAck, setAlertAck }: {
  alerts: AnomalyAlert[];
  alertAck: Set<string>;
  setAlertAck: (s: Set<string>) => void;
}) {
  const acknowledge = (id: string) => {
    const next = new Set(alertAck);
    next.add(id);
    setAlertAck(next);
  };

  const active = alerts.filter(a => !alertAck.has(a.id));
  const acknowledged = alerts.filter(a => alertAck.has(a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Anomaly Alerts</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{active.length} active</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-500">{acknowledged.length} acknowledged</span>
        </div>
      </div>

      {active.length === 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">All clear</p>
          <p className="text-sm text-slate-500 mt-1">No active anomalies detected across the network</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          {active.map(alert => (
            <div key={alert.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors">
              <AlertRow alert={alert} onAcknowledge={() => acknowledge(alert.id)} />
            </div>
          ))}
        </div>
      )}

      {acknowledged.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Acknowledged</h3>
          <div className="space-y-2 opacity-60">
            {acknowledged.map(alert => (
              <div key={alert.id} className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4">
                <AlertRow alert={alert} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== TRANSPARENCY VIEW ====================
function TransparencyView({ readings, alerts, avgWQI }: {
  readings: Record<string, SensorReading>;
  alerts: AnomalyAlert[];
  avgWQI: number;
}) {
  const wqiCategory = getWQICategory(avgWQI);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 rounded-xl border border-cyan-900/50 p-6">
        <h2 className="text-xl font-bold text-white mb-2">Public Transparency Report</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          This page provides open access to water quality data from Dal Lake's sensor network.
          Data is collected by low-cost ESP32 sensors deployed at {stations.length} locations and transmitted
          in real-time via MQTT protocol. This initiative aims to empower citizens, researchers, and
          authorities with transparent environmental data.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Overall Assessment</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: wqiCategory.color }}>{wqiCategory.label}</p>
          <p className="text-xs text-slate-500 mt-1">Average WQI: {avgWQI}/100</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Data Availability</span>
          </div>
          <p className="text-2xl font-bold text-white">99.2%</p>
          <p className="text-xs text-slate-500 mt-1">Uptime over last 30 days</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Alerts Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
          <p className="text-xs text-slate-500 mt-1">{alerts.filter(a => a.severity === 'critical').length} critical</p>
        </div>
      </div>

      {/* Standards Reference */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Water Quality Standards (CPCB Class B — Bathing Standard)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Parameter</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Desirable Limit</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Permissible Limit</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">pH</td><td className="py-2 px-3">6.5 – 8.5</td><td className="py-2 px-3">6.0 – 9.0</td><td className="py-2 px-3">—</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">Dissolved Oxygen</td><td className="py-2 px-3">≥ 6.0</td><td className="py-2 px-3">≥ 4.0</td><td className="py-2 px-3">mg/L</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">Turbidity</td><td className="py-2 px-3">≤ 2.0</td><td className="py-2 px-3">≤ 5.0</td><td className="py-2 px-3">NTU</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">Ammonia Nitrogen</td><td className="py-2 px-3">≤ 0.5</td><td className="py-2 px-3">≤ 1.2</td><td className="py-2 px-3">mg/L</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">Total Coliform</td><td className="py-2 px-3">≤ 100</td><td className="py-2 px-3">≤ 500</td><td className="py-2 px-3">MPN/100mL</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 px-3">Conductivity</td><td className="py-2 px-3">≤ 500</td><td className="py-2 px-3">≤ 1000</td><td className="py-2 px-3">μS/cm</td></tr>
              <tr><td className="py-2 px-3">Temperature</td><td className="py-2 px-3">—</td><td className="py-2 px-3">Natural</td><td className="py-2 px-3">°C</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Comparison Chart */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Station-wise WQI Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stations.map(s => {
            const r = readings[s.id];
            const wqi = r ? getWaterQualityIndex(r) : 0;
            return { name: s.name, wqi, fill: getWQICategory(wqi).color };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#475569" fontSize={10} />
            <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
            />
            <Bar dataKey="wqi" radius={[4, 4, 0, 0]} fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Technical Info */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          System Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-medium text-cyan-300 mb-1">Sensor Layer</p>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• ESP32 microcontrollers</li>
              <li>• pH, DO, turbidity, temp probes</li>
              <li>• TDS & conductivity sensors</li>
              <li>• Solar-powered with LiPo backup</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-medium text-cyan-300 mb-1">Communication</p>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• MQTT protocol (QoS 1)</li>
              <li>• WiFi → 4G fallback</li>
              <li>• 10-second sampling interval</li>
              <li>• Edge-computed anomaly flags</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-medium text-cyan-300 mb-1">Dashboard</p>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• Real-time WebSocket updates</li>
              <li>• Threshold-based alerting</li>
              <li>• 30-day data retention</li>
              <li>• Open data API (REST)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-400">Disclaimer:</strong> This dashboard presents data from low-cost sensor nodes.
          While calibrated regularly, readings may have ±5-10% variance compared to laboratory-grade equipment.
          This data is intended for awareness and trend monitoring — not regulatory compliance.
          For official water quality certification, refer to J&K Pollution Control Committee laboratory results.
        </p>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-950/50 to-emerald-900/20 border-emerald-900/50',
    cyan: 'from-cyan-950/50 to-cyan-900/20 border-cyan-900/50',
    amber: 'from-amber-950/50 to-amber-900/20 border-amber-900/50',
    violet: 'from-violet-950/50 to-violet-900/20 border-violet-900/50',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl border p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg px-2.5 py-1.5">
      <span className="text-slate-500">{label}:</span>{' '}
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}

function AlertRow({ alert, onAcknowledge }: { alert: AnomalyAlert; onAcknowledge?: () => void }) {
  const severityColors = {
    critical: 'bg-red-950 border-red-900 text-red-300',
    high: 'bg-orange-950 border-orange-900 text-orange-300',
    medium: 'bg-amber-950 border-amber-900 text-amber-300',
    low: 'bg-yellow-950 border-yellow-900 text-yellow-300',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${severityColors[alert.severity]}`}>
        {alert.severity}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{alert.message}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {alert.parameter}: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value} {alert.unit}
          {' '}(threshold: {typeof alert.threshold === 'number' ? alert.threshold.toFixed(1) : alert.threshold})
          {' '}• {alert.stationName} • {new Date(alert.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {onAcknowledge && (
        <button
          onClick={onAcknowledge}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors whitespace-nowrap"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}

function ParameterGrid({ reading }: { reading: SensorReading }) {
  const params = [
    { label: 'pH', value: reading.ph.toFixed(2), unit: '', icon: <Droplets className="w-4 h-4" />, min: 6.5, max: 8.5 },
    { label: 'Dissolved Oxygen', value: reading.dissolvedOxygen.toFixed(1), unit: 'mg/L', icon: <Wind className="w-4 h-4" />, min: 5.0, max: 14.0 },
    { label: 'Turbidity', value: reading.turbidity.toFixed(1), unit: 'NTU', icon: <Eye className="w-4 h-4" />, min: 0, max: 5.0 },
    { label: 'Temperature', value: reading.temperature.toFixed(1), unit: '°C', icon: <Thermometer className="w-4 h-4" />, min: 4.0, max: 28.0 },
    { label: 'Conductivity', value: reading.conductivity.toFixed(0), unit: 'μS/cm', icon: <Zap className="w-4 h-4" />, min: 0, max: 1000 },
    { label: 'TDS', value: reading.totalDissolvedSolids.toFixed(0), unit: 'mg/L', icon: <Droplets className="w-4 h-4" />, min: 0, max: 500 },
    { label: 'Ammonia-N', value: reading.ammoniaNitrogen.toFixed(2), unit: 'mg/L', icon: <Activity className="w-4 h-4" />, min: 0, max: 1.2 },
    { label: 'Coliform', value: Math.round(reading.coliformCount).toString(), unit: 'MPN/100mL', icon: <Shield className="w-4 h-4" />, min: 0, max: 500 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {params.map(p => {
        const numVal = parseFloat(p.value);
        const isOutOfRange = p.label === 'pH'
          ? (numVal < p.min || numVal > p.max)
          : numVal > p.max;
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';

        return (
          <div key={p.label} className={`rounded-lg border p-3 ${isOutOfRange ? 'bg-red-950/30 border-red-900/50' : 'bg-slate-800/30 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{p.label}</span>
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                {trend === 'stable' && <Minus className="w-3 h-3 text-slate-500" />}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${isOutOfRange ? 'text-red-400' : 'text-white'}`}>{p.value}</span>
              <span className="text-xs text-slate-500">{p.unit}</span>
            </div>
            {isOutOfRange && (
              <p className="text-[10px] text-red-400 mt-1">⚠ Outside safe range</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
