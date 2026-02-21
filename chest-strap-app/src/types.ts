export type HeartRateZone = 'rest' | 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';

export interface ChestStrapReading {
  sensor_type: 'chest_strap';
  device_id: string;
  timestamp: number;
  heart_rate_bpm: number;
  heart_rate_zone: HeartRateZone;
  hrv_rmssd_ms: number;
  rr_intervals: number[];
  contact_detected: boolean;
  battery_percent: number;
  session_duration_sec: number;
  avg_heart_rate: number;
  max_heart_rate: number;
}

export type ConnectionState =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export interface HRMeasurement {
  heartRate: number;
  contactDetected: boolean;
  rrIntervals: number[];
}
