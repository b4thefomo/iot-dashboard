import { Buffer } from 'buffer';
import { HRMeasurement } from './types';

/**
 * Parse BLE Heart Rate Measurement characteristic (0x2A37).
 * react-native-ble-plx delivers values as base64 strings.
 */
export function parseHeartRate(base64Value: string): HRMeasurement {
  const buf = Buffer.from(base64Value, 'base64');

  const flags = buf[0];
  const is16Bit = (flags & 0x01) !== 0;
  const hasContact = (flags & 0x04) !== 0;
  const contactDetected = hasContact ? (flags & 0x02) !== 0 : true;
  const hasEnergyExpended = (flags & 0x08) !== 0;
  const hasRR = (flags & 0x10) !== 0;

  let offset = 1;
  let heartRate: number;

  if (is16Bit) {
    heartRate = buf.readUInt16LE(offset);
    offset += 2;
  } else {
    heartRate = buf[offset];
    offset += 1;
  }

  if (hasEnergyExpended) {
    offset += 2;
  }

  const rrIntervals: number[] = [];
  if (hasRR) {
    while (offset + 1 < buf.length) {
      const rr = buf.readUInt16LE(offset);
      // RR value is in 1/1024 seconds, convert to ms
      rrIntervals.push((rr / 1024) * 1000);
      offset += 2;
    }
  }

  return { heartRate, contactDetected, rrIntervals };
}

/**
 * Parse BLE Battery Level characteristic (0x2A19).
 */
export function parseBatteryLevel(base64Value: string): number {
  const buf = Buffer.from(base64Value, 'base64');
  return buf[0];
}
