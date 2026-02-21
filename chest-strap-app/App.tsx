import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { setCallbacks, startScan, disconnect, destroyManager } from './src/ble';
import { SessionTracker, getHeartRateZone } from './src/hrv';
import { postReading } from './src/api';
import { ConnectionState, HRMeasurement } from './src/types';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [heartRate, setHeartRate] = useState(0);
  const [rmssd, setRmssd] = useState(0);
  const [battery, setBattery] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [contact, setContact] = useState(true);
  const [deviceId] = useState('BLE_CHEST_STRAP');

  const tracker = useRef(new SessionTracker());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryRef = useRef<number | null>(null);

  const onMeasurement = useCallback((m: HRMeasurement) => {
    setHeartRate(m.heartRate);
    setContact(m.contactDetected);
    tracker.current.addReading(m.heartRate, m.rrIntervals);
    setRmssd(tracker.current.rmssd);

    postReading({
      sensor_type: 'chest_strap',
      device_id: deviceId,
      timestamp: Date.now(),
      heart_rate_bpm: m.heartRate,
      heart_rate_zone: getHeartRateZone(m.heartRate),
      hrv_rmssd_ms: tracker.current.rmssd,
      rr_intervals: m.rrIntervals,
      contact_detected: m.contactDetected,
      battery_percent: batteryRef.current ?? 100,
      session_duration_sec: tracker.current.durationSec,
      avg_heart_rate: tracker.current.avgHr,
      max_heart_rate: tracker.current.maxHr,
    });
  }, [deviceId]);

  const onBattery = useCallback((level: number) => {
    batteryRef.current = level;
    setBattery(level);
  }, []);

  const onStateChange = useCallback((state: 'scanning' | 'connecting' | 'connected' | 'disconnected') => {
    setConnectionState(state);
  }, []);

  useEffect(() => {
    setCallbacks(onMeasurement, onBattery, onStateChange);
  }, [onMeasurement, onBattery, onStateChange]);

  useEffect(() => {
    if (connectionState === 'connected') {
      timerRef.current = setInterval(() => {
        setSessionTime(tracker.current.durationSec);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  useEffect(() => {
    return () => {
      destroyManager();
    };
  }, []);

  const handleConnect = async () => {
    tracker.current.reset();
    setHeartRate(0);
    setRmssd(0);
    setSessionTime(0);
    await startScan();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const isActive = connectionState !== 'disconnected';
  const statusColor = connectionState === 'connected' ? '#22c55e' : connectionState === 'disconnected' ? '#64748b' : '#f59e0b';

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const zoneColor = (bpm: number) => {
    if (bpm < 100) return '#64748b';
    if (bpm < 120) return '#3b82f6';
    if (bpm < 140) return '#22c55e';
    if (bpm < 160) return '#f59e0b';
    if (bpm < 180) return '#f97316';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chest Strap</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>
            {connectionState === 'disconnected' ? 'Not Connected' :
             connectionState === 'scanning' ? 'Scanning...' :
             connectionState === 'connecting' ? 'Connecting...' : 'Connected'}
          </Text>
        </View>
      </View>

      {/* Heart Rate Display */}
      <View style={styles.hrContainer}>
        <Text style={styles.hrLabel}>HEART RATE</Text>
        <View style={styles.hrRow}>
          <Text style={[styles.hrValue, { color: heartRate > 0 ? zoneColor(heartRate) : '#64748b' }]}>
            {heartRate > 0 ? heartRate : '--'}
          </Text>
          <Text style={styles.hrUnit}>BPM</Text>
        </View>
        {heartRate > 0 && (
          <Text style={[styles.zoneLabel, { color: zoneColor(heartRate) }]}>
            {getHeartRateZone(heartRate).toUpperCase()}
          </Text>
        )}
        {!contact && heartRate > 0 && (
          <Text style={styles.noContact}>No skin contact</Text>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>HRV (rMSSD)</Text>
          <Text style={styles.statValue}>{rmssd > 0 ? `${rmssd} ms` : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Battery</Text>
          <Text style={styles.statValue}>{battery !== null ? `${battery}%` : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Session</Text>
          <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg HR</Text>
          <Text style={styles.statValue}>{tracker.current.avgHr > 0 ? `${tracker.current.avgHr}` : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max HR</Text>
          <Text style={styles.statValue}>{tracker.current.maxHr > 0 ? `${tracker.current.maxHr}` : '--'}</Text>
        </View>
      </View>

      {/* Connect / Disconnect Button */}
      <View style={styles.buttonContainer}>
        {!isActive ? (
          <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>
              {connectionState === 'connected' ? 'Disconnect' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footer}>
        Flux IoT — BLE Bridge
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 10 : 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  hrContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  hrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 2,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  hrValue: {
    fontSize: 96,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  hrUnit: {
    fontSize: 18,
    color: '#64748b',
    marginLeft: 6,
    marginBottom: 12,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: -4,
  },
  noContact: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 100,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: '#e2e8f0',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  connectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 12,
    marginBottom: 10,
  },
});
