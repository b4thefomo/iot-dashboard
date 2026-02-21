import { ChestStrapReading } from './types';

const API_URL = 'https://iot-dashboard-dij1.onrender.com/api/data';

/**
 * Fire-and-forget POST of a heart rate reading to the server.
 * No retry — readings arrive every ~1s so a missed one is fine.
 */
export function postReading(reading: ChestStrapReading): void {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reading),
  }).catch(() => {
    // Silently ignore network errors
  });
}
