// Dal Lake monitoring stations
export interface Station {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'maintenance';
  lastPing: Date;
}

export interface SensorReading {
  timestamp: Date;
  ph: number;
  dissolvedOxygen: number; // mg/L
  turbidity: number; // NTU
  temperature: number; // °C
  conductivity: number; // μS/cm
  totalDissolvedSolids: number; // mg/L
  ammoniaNitrogen: number; // mg/L
  coliformCount: number; // MPN/100mL
}

export interface AnomalyAlert {
  id: string;
  stationId: string;
  stationName: string;
  parameter: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  unit: string;
  timestamp: Date;
  message: string;
  acknowledged: boolean;
}

export const stations: Station[] = [
  {
    id: 'DL-N1',
    name: 'Nishat Basin',
    location: 'Near Nishat Bagh inlet',
    lat: 34.1130,
    lng: 74.8360,
    status: 'online',
    lastPing: new Date(),
  },
  {
    id: 'DL-N2',
    name: 'Hazratbal Shore',
    location: 'Hazratbal shrine area',
    lat: 34.1320,
    lng: 74.8170,
    status: 'online',
    lastPing: new Date(),
  },
  {
    id: 'DL-C1',
    name: 'Central Basin',
    location: 'Open water, central Dal',
    lat: 34.1250,
    lng: 74.8280,
    status: 'online',
    lastPing: new Date(),
  },
  {
    id: 'DL-B1',
    name: 'Brari Nambal',
    location: 'Brari Nambal wetland junction',
    lat: 34.1080,
    lng: 74.8100,
    status: 'maintenance',
    lastPing: new Date(Date.now() - 3600000),
  },
  {
    id: 'DL-G1',
    name: 'Gagribal Basin',
    location: 'Gagribal residential shore',
    lat: 34.1180,
    lng: 74.8450,
    status: 'online',
    lastPing: new Date(),
  },
  {
    id: 'DL-N3',
    name: 'Nagin Basin',
    location: 'Nagin area, eastern Dal',
    lat: 34.1050,
    lng: 74.8520,
    status: 'online',
    lastPing: new Date(),
  },
];

// Water quality standards (CPCB Class B - bathing)
export const thresholds = {
  ph: { min: 6.5, max: 8.5, ideal: 7.2 },
  dissolvedOxygen: { min: 5.0, ideal: 7.0 },
  turbidity: { max: 5.0, ideal: 2.0 },
  temperature: { min: 4.0, max: 28.0 },
  conductivity: { max: 1000, ideal: 500 },
  totalDissolvedSolids: { max: 500, ideal: 300 },
  ammoniaNitrogen: { max: 1.2, ideal: 0.3 },
  coliformCount: { max: 500, ideal: 100 },
};

// Generate realistic sensor readings with some variation
function generateReading(base: Partial<SensorReading>, noise = 0.1): SensorReading {
  const now = new Date();
  return {
    timestamp: now,
    ph: base.ph ?? 7.2 + (Math.random() - 0.5) * noise * 2,
    dissolvedOxygen: base.dissolvedOxygen ?? 6.5 + (Math.random() - 0.5) * noise * 4,
    turbidity: base.turbidity ?? 3.2 + (Math.random() - 0.5) * noise * 8,
    temperature: base.temperature ?? 14.5 + (Math.random() - 0.5) * noise * 6,
    conductivity: base.conductivity ?? 420 + (Math.random() - 0.5) * noise * 200,
    totalDissolvedSolids: base.totalDissolvedSolids ?? 280 + (Math.random() - 0.5) * noise * 150,
    ammoniaNitrogen: base.ammoniaNitrogen ?? 0.4 + (Math.random() - 0.5) * noise * 1.5,
    coliformCount: base.coliformCount ?? Math.max(10, 150 + (Math.random() - 0.5) * noise * 400),
  };
}

// Station-specific base readings (some stations are more polluted)
const stationBases: Record<string, Partial<SensorReading>> = {
  'DL-N1': { ph: 7.1, dissolvedOxygen: 5.8, turbidity: 4.1, ammoniaNitrogen: 0.6, coliformCount: 280 },
  'DL-N2': { ph: 7.4, dissolvedOxygen: 7.2, turbidity: 2.1, ammoniaNitrogen: 0.2, coliformCount: 90 },
  'DL-C1': { ph: 7.3, dissolvedOxygen: 6.8, turbidity: 2.8, ammoniaNitrogen: 0.3, coliformCount: 120 },
  'DL-B1': { ph: 6.9, dissolvedOxygen: 5.2, turbidity: 5.5, ammoniaNitrogen: 0.9, coliformCount: 450 },
  'DL-G1': { ph: 7.0, dissolvedOxygen: 5.5, turbidity: 4.8, ammoniaNitrogen: 0.7, coliformCount: 350 },
  'DL-N3': { ph: 7.2, dissolvedOxygen: 6.2, turbidity: 3.5, ammoniaNitrogen: 0.5, coliformCount: 200 },
};

export function getCurrentReadings(): Record<string, SensorReading> {
  const readings: Record<string, SensorReading> = {};
  for (const station of stations) {
    readings[station.id] = generateReading(stationBases[station.id] || {}, 0.15);
  }
  return readings;
}

// Generate 24-hour history for a station
export function generateHistory(stationId: string, hours = 24): SensorReading[] {
  const history: SensorReading[] = [];
  const base = stationBases[stationId] || {};
  const now = Date.now();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const hourOfDay = timestamp.getHours();
    // Diurnal patterns
    const tempVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 2;
    const doVariation = -Math.sin((hourOfDay - 6) * Math.PI / 12) * 1.2;

    history.push({
      timestamp,
      ph: (base.ph ?? 7.2) + (Math.random() - 0.5) * 0.3,
      dissolvedOxygen: (base.dissolvedOxygen ?? 6.5) + doVariation + (Math.random() - 0.5) * 0.8,
      turbidity: (base.turbidity ?? 3.2) + (Math.random() - 0.5) * 1.5,
      temperature: (base.temperature ?? 14.5) + tempVariation + (Math.random() - 0.5) * 1.0,
      conductivity: (base.conductivity ?? 420) + (Math.random() - 0.5) * 50,
      totalDissolvedSolids: (base.totalDissolvedSolids ?? 280) + (Math.random() - 0.5) * 40,
      ammoniaNitrogen: (base.ammoniaNitrogen ?? 0.4) + (Math.random() - 0.5) * 0.2,
      coliformCount: Math.max(10, (base.coliformCount ?? 150) + (Math.random() - 0.5) * 80),
    });
  }
  return history;
}

// Generate anomaly alerts
export function generateAlerts(readings: Record<string, SensorReading>): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  let alertId = 0;

  for (const station of stations) {
    const r = readings[station.id];
    if (!r) continue;

    if (r.ph < thresholds.ph.min || r.ph > thresholds.ph.max) {
      alerts.push({
        id: `alert-${alertId++}`,
        stationId: station.id,
        stationName: station.name,
        parameter: 'pH',
        severity: r.ph < 6.0 || r.ph > 9.0 ? 'critical' : 'medium',
        value: r.ph,
        threshold: r.ph < thresholds.ph.min ? thresholds.ph.min : thresholds.ph.max,
        unit: '',
        timestamp: r.timestamp,
        message: `pH level ${r.ph < thresholds.ph.min ? 'below' : 'above'} safe range at ${station.name}`,
        acknowledged: false,
      });
    }

    if (r.dissolvedOxygen < thresholds.dissolvedOxygen.min) {
      alerts.push({
        id: `alert-${alertId++}`,
        stationId: station.id,
        stationName: station.name,
        parameter: 'Dissolved Oxygen',
        severity: r.dissolvedOxygen < 3.0 ? 'critical' : r.dissolvedOxygen < 4.0 ? 'high' : 'medium',
        value: r.dissolvedOxygen,
        threshold: thresholds.dissolvedOxygen.min,
        unit: 'mg/L',
        timestamp: r.timestamp,
        message: `Low dissolved oxygen detected at ${station.name} — aquatic life at risk`,
        acknowledged: false,
      });
    }

    if (r.turbidity > thresholds.turbidity.max) {
      alerts.push({
        id: `alert-${alertId++}`,
        stationId: station.id,
        stationName: station.name,
        parameter: 'Turbidity',
        severity: r.turbidity > 10 ? 'high' : 'medium',
        value: r.turbidity,
        threshold: thresholds.turbidity.max,
        unit: 'NTU',
        timestamp: r.timestamp,
        message: `High turbidity at ${station.name} — possible sewage inflow or sediment disturbance`,
        acknowledged: false,
      });
    }

    if (r.ammoniaNitrogen > thresholds.ammoniaNitrogen.max) {
      alerts.push({
        id: `alert-${alertId++}`,
        stationId: station.id,
        stationName: station.name,
        parameter: 'Ammonia-N',
        severity: r.ammoniaNitrogen > 2.0 ? 'critical' : 'high',
        value: r.ammoniaNitrogen,
        threshold: thresholds.ammoniaNitrogen.max,
        unit: 'mg/L',
        timestamp: r.timestamp,
        message: `Elevated ammonia at ${station.name} — possible sewage contamination`,
        acknowledged: false,
      });
    }

    if (r.coliformCount > thresholds.coliformCount.max) {
      alerts.push({
        id: `alert-${alertId++}`,
        stationId: station.id,
        stationName: station.name,
        parameter: 'Coliform',
        severity: r.coliformCount > 2000 ? 'critical' : r.coliformCount > 1000 ? 'high' : 'medium',
        value: r.coliformCount,
        threshold: thresholds.coliformCount.max,
        unit: 'MPN/100mL',
        timestamp: r.timestamp,
        message: `Coliform count exceeds safe limit at ${station.name}`,
        acknowledged: false,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return sev[a.severity] - sev[b.severity];
  });
}

export function getWaterQualityIndex(reading: SensorReading): number {
  // Simplified WQI calculation
  const phScore = Math.max(0, 100 - Math.abs(reading.ph - 7.0) * 25);
  const doScore = Math.min(100, (reading.dissolvedOxygen / 8.0) * 100);
  const turbScore = Math.max(0, 100 - reading.turbidity * 10);
  const nh3Score = Math.max(0, 100 - reading.ammoniaNitrogen * 50);
  const colScore = Math.max(0, 100 - (reading.coliformCount / 500) * 50);

  return Math.round((phScore * 0.15 + doScore * 0.25 + turbScore * 0.2 + nh3Score * 0.2 + colScore * 0.2));
}

export function getWQICategory(wqi: number): { label: string; color: string } {
  if (wqi >= 90) return { label: 'Excellent', color: '#10b981' };
  if (wqi >= 70) return { label: 'Good', color: '#22c55e' };
  if (wqi >= 50) return { label: 'Fair', color: '#eab308' };
  if (wqi >= 25) return { label: 'Poor', color: '#f97316' };
  return { label: 'Critical', color: '#ef4444' };
}
