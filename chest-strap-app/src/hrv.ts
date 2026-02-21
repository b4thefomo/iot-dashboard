import { HeartRateZone } from './types';

const MAX_RR_BUFFER = 64;

export function computeRmssd(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  return Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));
}

export function getHeartRateZone(bpm: number): HeartRateZone {
  if (bpm < 100) return 'rest';
  if (bpm < 120) return 'zone1';
  if (bpm < 140) return 'zone2';
  if (bpm < 160) return 'zone3';
  if (bpm < 180) return 'zone4';
  return 'zone5';
}

export class SessionTracker {
  private rrBuffer: number[] = [];
  private readingCount = 0;
  private hrSum = 0;
  private _maxHr = 0;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  addReading(heartRate: number, rrIntervals: number[]) {
    this.readingCount++;
    this.hrSum += heartRate;
    if (heartRate > this._maxHr) this._maxHr = heartRate;

    for (const rr of rrIntervals) {
      this.rrBuffer.push(rr);
    }
    if (this.rrBuffer.length > MAX_RR_BUFFER) {
      this.rrBuffer = this.rrBuffer.slice(-MAX_RR_BUFFER);
    }
  }

  get rmssd(): number {
    return Math.round(computeRmssd(this.rrBuffer) * 10) / 10;
  }

  get avgHr(): number {
    return this.readingCount > 0 ? Math.round(this.hrSum / this.readingCount) : 0;
  }

  get maxHr(): number {
    return this._maxHr;
  }

  get durationSec(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  reset() {
    this.rrBuffer = [];
    this.readingCount = 0;
    this.hrSum = 0;
    this._maxHr = 0;
    this.startTime = Date.now();
  }
}
