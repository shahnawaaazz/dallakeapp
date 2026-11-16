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
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, AlertTriangle, CheckCircle, Droplets, Thermometer,
  Wind, Eye, Zap, MapPin, Clock, ChevronRight, BarChart3,
  Shield, Wifi, WifiOff, Wrench, Bell, X, Info,
  TrendingUp, TrendingDown, Minus, Waves,
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
    <div className="min-h-screen text-slate-100" style={{ background: 'linear-gradient(135deg, #050a18 0%, #0a1128 40%, #0d1530 100%)' }}>
      {/* Alert Toast */}
      {showAlertToast && unacknowledgedAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 rounded-xl p-4 shadow-2xl max-w-sm"
          style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #2d1800 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: '#fbbf24' }} />
            <span className="font-semibold" style={{ color: '#fde68a' }}>
              {unacknowledgedAlerts.length} new alert{unacknowledgedAlerts.length > 1 ? 's' : ''} detected
            </span>
            <button onClick={() => setShowAlertToast(false)} className="ml-auto opacity-60 hover:opacity-100">
              <X className="w-4 h-4" style={{ color: '#fbbf24' }} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, rgba(5,10,24,0.98) 0%, rgba(10,17,40,0.95) 100%)', borderBottom: '1px solid rgba(99, 179, 237, 0.08)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0369a1 100%)', boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)' }}>
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: '#e2e8f0' }}>Dal Lake Water Quality Monitor</h1>
                <p className="text-xs" style={{ color: '#64748b' }}>Srinagar, Jammu & Kashmir • ESP32 Sensor Network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                <Clock className="w-3.5 h-3.5" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
                <span className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>LIVE</span>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-0.5">
            {[
              { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
              { id: 'stations' as Tab, label: 'Stations', icon: MapPin },
              { id: 'alerts' as Tab, label: `Alerts${unacknowledgedAlerts.length > 0 ? ` (${unacknowledgedAlerts.length})` : ''}`, icon: Bell },
              { id: 'transparency' as Tab, label: 'Public Transparency', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200"
                style={activeTab === tab.id ? {
                  borderColor: '#2dd4bf',
                  color: '#2dd4bf',
                  background: 'linear-gradient(180deg, rgba(45, 212, 191, 0.05) 0%, transparent 100%)',
                } : {
                  borderColor: 'transparent',
                  color: '#64748b',
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
          icon={<Wifi className="w-5 h-5" style={{ color: '#34d399' }} />}
          gradient="linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.08) 100%)"
          borderColor="rgba(52, 211, 153, 0.15)"
        />
        <StatCard
          label="Avg Water Quality Index"
          value={`${avgWQI}`}
          sub={wqiCategory.label}
          icon={<Activity className="w-5 h-5" style={{ color: '#2dd4bf' }} />}
          gradient="linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(13,148,136,0.08) 100%)"
          borderColor="rgba(45, 212, 191, 0.15)"
        />
        <StatCard
          label="Active Alerts"
          value={`${alerts.length}`}
          sub={`${criticalAlerts.length} high/critical`}
          icon={<AlertTriangle className="w-5 h-5" style={{ color: '#fbbf24' }} />}
          gradient="linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(146,64,14,0.08) 100%)"
          borderColor="rgba(251, 191, 36, 0.15)"
        />
        <StatCard
          label="Sampling Interval"
          value="10s"
          sub="ESP32 → MQTT → Dashboard"
          icon={<Zap className="w-5 h-5" style={{ color: '#a78bfa' }} />}
          gradient="linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(88,28,135,0.08) 100%)"
          borderColor="rgba(167, 139, 250, 0.15)"
        />
      </div>

      {/* WQI Gauge + Station Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <h3 className="text-sm font-medium mb-5" style={{ color: '#94a3b8' }}>Lake-Wide WQI Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="wqiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={wqiCategory.color} />
                    <stop offset="100%" stopColor={wqiCategory.color} stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#wqiGrad)"
                  strokeWidth="7"
                  strokeDasharray={`${avgWQI * 2.64} 264`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${wqiCategory.glow})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: '#f1f5f9' }}>{avgWQI}</span>
                <span className="text-xs mt-0.5" style={{ color: '#64748b' }}>/ 100</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${wqiCategory.glow}`, border: `1px solid ${wqiCategory.color}33` }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wqiCategory.color, boxShadow: `0 0 8px ${wqiCategory.glow}` }} />
              <span className="text-sm font-semibold" style={{ color: wqiCategory.color }}>{wqiCategory.label}</span>
            </div>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(99,179,237,0.06)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
              WQI computed from pH, dissolved oxygen, turbidity, ammonia-nitrogen, and coliform count using weighted CPCB methodology.
            </p>
          </div>
        </div>

        {/* Station Map */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: '#94a3b8' }}>Monitoring Stations — Dal Lake</h3>
          <div className="relative rounded-xl overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(135deg, rgba(8,15,35,0.9) 0%, rgba(12,20,45,0.9) 100%)' }}>
            <svg viewBox="0 0 500 300" className="w-full h-full" style={{ minHeight: '280px' }}>
              <defs>
                <radialGradient id="lakeFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
                </radialGradient>
              </defs>
              {/* Lake outline */}
              <path
                d="M120,60 C180,40 320,35 380,55 C420,70 440,100 445,140 C450,180 430,220 400,245 C360,270 280,280 220,275 C160,270 110,250 90,220 C70,190 65,150 75,110 C85,80 100,65 120,60Z"
                fill="url(#lakeFill)"
                stroke="#0d9488"
                strokeWidth="1.5"
                opacity="0.6"
              />
              {/* Station markers */}
              {stations.map((station, i) => {
                const positions = [
                  { x: 350, y: 100 }, { x: 200, y: 70 }, { x: 260, y: 150 },
                  { x: 160, y: 230 }, { x: 380, y: 160 }, { x: 340, y: 220 },
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
                      <circle cx={pos.x} cy={pos.y} r="20" fill={cat.color} opacity="0.1">
                        <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.1;0.05;0.1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={pos.x} cy={pos.y} r="9"
                      fill={isOnline ? cat.color : '#475569'}
                      stroke={isSelected ? '#f1f5f9' : 'rgba(255,255,255,0.1)'}
                      strokeWidth={isSelected ? "2.5" : "1"}
                      style={isOnline ? { filter: `drop-shadow(0 0 4px ${cat.glow})` } : {}}
                    />
                    {!isOnline && (
                      <circle cx={pos.x} cy={pos.y} r="9" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
                    )}
                    <text x={pos.x} y={pos.y - 16} textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="500">
                      {station.name}
                    </text>
                    <text x={pos.x} y={pos.y + 22} textAnchor="middle" fontSize="9" fill="#64748b">
                      WQI: {wqi}
                    </text>
                  </g>
                );
              })}
              <g transform="translate(10, 265)">
                <circle cx="4" cy="-3" r="3.5" fill="#34d399" />
                <text x="12" y="0" fontSize="9" fill="#64748b">Online</text>
                <circle cx="64" cy="-3" r="3.5" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 1" />
                <text x="72" y="0" fontSize="9" fill="#64748b">Maintenance</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Time Series Charts */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            24-Hour Trend — {stations.find(s => s.id === selectedStation)?.name}
          </h3>
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,179,237,0.12)', color: '#cbd5e1' }}
          >
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>Dissolved Oxygen (mg/L)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).getHours() + ':00'} stroke="#334155" fontSize={10} />
                <YAxis stroke="#334155" fontSize={10} domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} labelFormatter={(l) => new Date(l).toLocaleString()} />
                <Area type="monotone" dataKey="dissolvedOxygen" stroke="#2dd4bf" fill="url(#doGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>Turbidity (NTU)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).getHours() + ':00'} stroke="#334155" fontSize={10} />
                <YAxis stroke="#334155" fontSize={10} domain={[0, 12]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} labelFormatter={(l) => new Date(l).toLocaleString()} />
                <Area type="monotone" dataKey="turbidity" stroke="#fbbf24" fill="url(#turbGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current Readings */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
        <h3 className="text-sm font-medium mb-5" style={{ color: '#94a3b8' }}>Current Readings — All Parameters</h3>
        {selectedReading && <ParameterGrid reading={selectedReading} />}
      </div>

      {/* Recent Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#94a3b8' }}>High Priority Alerts</h3>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#2dd4bf' }}
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
        <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Monitoring Stations</h2>
        <span className="text-xs" style={{ color: '#64748b' }}>{stations.length} sensors deployed across Dal Lake</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stations.map(station => {
          const reading = readings[station.id];
          const wqi = reading ? getWaterQualityIndex(reading) : 0;
          const cat = getWQICategory(wqi);
          const stationAlerts = alerts.filter(a => a.stationId === station.id);

          return (
            <div key={station.id} className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)', border: '1px solid rgba(99,179,237,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.15)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{station.name}</h4>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{station.location}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  station.status === 'online' ? '' :
                  station.status === 'maintenance' ? '' : ''
                }`} style={{
                  background: station.status === 'online' ? 'rgba(52,211,153,0.1)' : station.status === 'maintenance' ? 'rgba(251,191,36,0.1)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${station.status === 'online' ? 'rgba(52,211,153,0.2)' : station.status === 'maintenance' ? 'rgba(251,191,36,0.2)' : 'rgba(244,63,94,0.2)'}`,
                  color: station.status === 'online' ? '#6ee7b7' : station.status === 'maintenance' ? '#fde68a' : '#fda4af',
                }}>
                  {station.status === 'online' && <Wifi className="w-3 h-3" />}
                  {station.status === 'maintenance' && <Wrench className="w-3 h-3" />}
                  {station.status === 'offline' && <WifiOff className="w-3 h-3" />}
                  {station.status}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={cat.color}
                      strokeWidth="6"
                      strokeDasharray={`${wqi * 2.64} 264`}
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 4px ${cat.glow})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: '#f1f5f9' }}>{wqi}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>Water Quality Index</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: cat.color }}>{cat.label}</p>
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
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(99,179,237,0.06)' }}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-medium" style={{ color: '#fde68a' }}>{stationAlerts.length} active alert{stationAlerts.length > 1 ? 's' : ''}</span>
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
        <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Anomaly Alerts</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(244,63,94,0.1)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.15)' }}>{active.length} active</span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.1)' }}>{acknowledged.length} resolved</span>
        </div>
      </div>

      {active.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(52,211,153,0.1)' }}>
          <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#34d399' }} />
          <p className="font-semibold text-lg" style={{ color: '#e2e8f0' }}>All Clear</p>
          <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>No active anomalies detected across the network</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map(alert => (
            <div key={alert.id} className="rounded-xl p-4 transition-all duration-200 hover:border-opacity-20" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)', border: `1px solid ${alert.severity === 'critical' ? 'rgba(244,63,94,0.15)' : alert.severity === 'high' ? 'rgba(251,146,60,0.15)' : 'rgba(251,191,36,0.12)'}` }}>
              <AlertRow alert={alert} onAcknowledge={() => acknowledge(alert.id)} />
            </div>
          ))}
        </div>
      )}

      {acknowledged.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium mb-3" style={{ color: '#475569' }}>Acknowledged</h3>
          <div className="space-y-2 opacity-50">
            {acknowledged.map(alert => (
              <div key={alert.id} className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,179,237,0.04)' }}>
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
      <div className="rounded-2xl p-7" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(8,145,178,0.05) 50%, rgba(3,105,161,0.08) 100%)', border: '1px solid rgba(45,212,191,0.12)' }}>
        <h2 className="text-xl font-bold mb-3" style={{ color: '#f1f5f9' }}>Public Transparency Report</h2>
        <p className="text-sm leading-relaxed max-w-3xl" style={{ color: '#94a3b8' }}>
          This page provides open access to water quality data from Dal Lake's sensor network.
          Data is collected by low-cost ESP32 sensors deployed at {stations.length} locations and transmitted
          in real-time via MQTT protocol. This initiative aims to empower citizens, researchers, and
          authorities with transparent environmental data.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4" style={{ color: '#2dd4bf' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Overall Assessment</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: wqiCategory.color }}>{wqiCategory.label}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Average WQI: {avgWQI}/100</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" style={{ color: '#34d399' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Data Availability</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#f1f5f9' }}>99.2%</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Uptime over last 30 days</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: '#fbbf24' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Alerts Today</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#f1f5f9' }}>{alerts.length}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>{alerts.filter(a => a.severity === 'critical').length} critical</p>
        </div>
      </div>

      {/* Standards Reference */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
          <Info className="w-4 h-4" style={{ color: '#2dd4bf' }} />
          Water Quality Standards (CPCB Class B — Bathing Standard)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: '#94a3b8' }}>Parameter</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: '#94a3b8' }}>Desirable Limit</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: '#94a3b8' }}>Permissible Limit</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: '#94a3b8' }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['pH', '6.5 – 8.5', '6.0 – 9.0', '—'],
                ['Dissolved Oxygen', '≥ 6.0', '≥ 4.0', 'mg/L'],
                ['Turbidity', '≤ 2.0', '≤ 5.0', 'NTU'],
                ['Ammonia Nitrogen', '≤ 0.5', '≤ 1.2', 'mg/L'],
                ['Total Coliform', '≤ 100', '≤ 500', 'MPN/100mL'],
                ['Conductivity', '≤ 500', '≤ 1000', 'μS/cm'],
                ['Temperature', '—', 'Natural', '°C'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(99,179,237,0.04)' }}>
                  {row.map((cell, j) => (
                    <td key={j} className="py-2.5 px-3" style={{ color: j === 0 ? '#cbd5e1' : '#94a3b8' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Comparison Chart */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Station-wise WQI Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stations.map(s => {
            const r = readings[s.id];
            const wqi = r ? getWaterQualityIndex(r) : 0;
            return { name: s.name, wqi };
          })}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="name" stroke="#475569" fontSize={10} />
            <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            <Bar dataKey="wqi" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Technical Info */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(99,179,237,0.08)' }}>
        <h3 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
          <Zap className="w-4 h-4" style={{ color: '#a78bfa' }} />
          System Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { title: 'Sensor Layer', color: '#2dd4bf', items: ['ESP32 microcontrollers', 'pH, DO, turbidity, temp probes', 'TDS & conductivity sensors', 'Solar-powered with LiPo backup'] },
            { title: 'Communication', color: '#a78bfa', items: ['MQTT protocol (QoS 1)', 'WiFi → 4G fallback', '10-second sampling interval', 'Edge-computed anomaly flags'] },
            { title: 'Dashboard', color: '#fbbf24', items: ['Real-time WebSocket updates', 'Threshold-based alerting', '30-day data retention', 'Open data API (REST)'] },
          ].map((section, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(8,15,35,0.6)', border: '1px solid rgba(99,179,237,0.04)' }}>
              <p className="font-semibold mb-2.5" style={{ color: section.color }}>{section.title}</p>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <li key={j} className="text-xs flex items-start gap-2" style={{ color: '#94a3b8' }}>
                    <span style={{ color: section.color }}>•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(8,15,35,0.4)', border: '1px solid rgba(99,179,237,0.04)' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
          <strong style={{ color: '#64748b' }}>Disclaimer:</strong> This dashboard presents data from low-cost sensor nodes.
          While calibrated regularly, readings may have ±5-10% variance compared to laboratory-grade equipment.
          This data is intended for awareness and trend monitoring — not regulatory compliance.
          For official water quality certification, refer to J&K Pollution Control Committee laboratory results.
        </p>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================
function StatCard({ label, value, sub, icon, gradient, borderColor }: {
  label: string; value: string; sub: string; icon: React.ReactNode; gradient: string; borderColor: string;
}) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]" style={{ background: gradient, border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        {icon}
        <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#f1f5f9' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(8,15,35,0.5)', border: '1px solid rgba(99,179,237,0.04)' }}>
      <span style={{ color: '#64748b' }}>{label}:</span>{' '}
      <span className="font-semibold" style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}

function AlertRow({ alert, onAcknowledge }: { alert: AnomalyAlert; onAcknowledge?: () => void }) {
  const severityStyles = {
    critical: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.25)', text: '#fda4af' },
    high: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)', text: '#fdba74' },
    medium: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', text: '#fde68a' },
    low: { bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.25)', text: '#fef08a' },
  };
  const style = severityStyles[alert.severity];

  return (
    <div className="flex items-center gap-3">
      <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide" style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}>
        {alert.severity}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: '#e2e8f0' }}>{alert.message}</p>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
          {alert.parameter}: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value} {alert.unit}
          {' '}(threshold: {typeof alert.threshold === 'number' ? alert.threshold.toFixed(1) : alert.threshold})
          {' '}• {alert.stationName} • {new Date(alert.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {onAcknowledge && (
        <button
          onClick={onAcknowledge}
          className="px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)', color: '#5eead4' }}
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}

function ParameterGrid({ reading }: { reading: SensorReading }) {
  const params = [
    { label: 'pH', value: reading.ph.toFixed(2), unit: '', icon: <Droplets className="w-4 h-4" />, min: 6.5, max: 8.5, accent: '#2dd4bf' },
    { label: 'Dissolved Oxygen', value: reading.dissolvedOxygen.toFixed(1), unit: 'mg/L', icon: <Wind className="w-4 h-4" />, min: 5.0, max: 14.0, accent: '#38bdf8' },
    { label: 'Turbidity', value: reading.turbidity.toFixed(1), unit: 'NTU', icon: <Eye className="w-4 h-4" />, min: 0, max: 5.0, accent: '#fbbf24' },
    { label: 'Temperature', value: reading.temperature.toFixed(1), unit: '°C', icon: <Thermometer className="w-4 h-4" />, min: 4.0, max: 28.0, accent: '#f97316' },
    { label: 'Conductivity', value: reading.conductivity.toFixed(0), unit: 'μS/cm', icon: <Zap className="w-4 h-4" />, min: 0, max: 1000, accent: '#a78bfa' },
    { label: 'TDS', value: reading.totalDissolvedSolids.toFixed(0), unit: 'mg/L', icon: <Droplets className="w-4 h-4" />, min: 0, max: 500, accent: '#818cf8' },
    { label: 'Ammonia-N', value: reading.ammoniaNitrogen.toFixed(2), unit: 'mg/L', icon: <Activity className="w-4 h-4" />, min: 0, max: 1.2, accent: '#f43f5e' },
    { label: 'Coliform', value: Math.round(reading.coliformCount).toString(), unit: 'MPN/100mL', icon: <Shield className="w-4 h-4" />, min: 0, max: 500, accent: '#fb923c' },
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
          <div key={p.label} className="rounded-xl p-3.5 transition-all duration-200" style={{
            background: isOutOfRange
              ? 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.03) 100%)'
              : 'rgba(8,15,35,0.5)',
            border: isOutOfRange ? '1px solid rgba(244,63,94,0.15)' : '1px solid rgba(99,179,237,0.04)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#64748b' }}>{p.label}</span>
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: '#34d399' }} />}
                {trend === 'down' && <TrendingDown className="w-3 h-3" style={{ color: '#f87171' }} />}
                {trend === 'stable' && <Minus className="w-3 h-3" style={{ color: '#475569' }} />}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold" style={{ color: isOutOfRange ? '#f87171' : '#f1f5f9' }}>{p.value}</span>
              <span className="text-xs" style={{ color: '#475569' }}>{p.unit}</span>
            </div>
            {isOutOfRange && (
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#fda4af' }}>⚠ Outside safe range</p>
            )}
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.5)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${Math.min(100, (numVal / (p.max * 1.5)) * 100)}%`,
                background: isOutOfRange ? '#f43f5e' : p.accent,
                boxShadow: `0 0 6px ${isOutOfRange ? 'rgba(244,63,94,0.4)' : `${p.accent}44`}`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
