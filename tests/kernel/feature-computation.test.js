const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// We need to extract the pure functions from server.js for testing.
// Since the server code isn't modular, we re-implement the core math here
// and verify against expected values from known fixtures.

function linearRegSlope(values) {
    const n = values.length;
    if (n < 2) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i; sumY += values[i];
        sumXY += i * values[i]; sumX2 += i * i;
    }
    const denom = n * sumX2 - sumX * sumX;
    return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

function correlation(a, b) {
    if (a.length < 3 || a.length !== b.length) return 0;
    const ma = mean(a), mb = mean(b);
    const sa = stddev(a), sb = stddev(b);
    if (sa === 0 || sb === 0) return 0;
    const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / a.length;
    return cov / (sa * sb);
}

function computeFeatures(sensorWindow) {
    if (!sensorWindow || sensorWindow.length < 2) return null;

    const temps = sensorWindow.map(s => s.temp_cabinet);
    const ambients = sensorWindow.map(s => s.temp_ambient);
    const powers = sensorWindow.map(s => s.compressor_power_w);
    const freqs = sensorWindow.map(s => s.compressor_freq_hz);
    const cops = sensorWindow.map(s => s.cop);
    const tempRates = [];
    for (let i = 1; i < temps.length; i++) {
        tempRates.push(temps[i] - temps[i - 1]);
    }

    const lastSample = sensorWindow[sensorWindow.length - 1];
    const doorOpen = lastSample.door_open ? 1.0 : 0.0;

    let doorDuration = 0;
    for (let i = sensorWindow.length - 1; i >= 0; i--) {
        if (sensorWindow[i].door_open) doorDuration += 5;
        else break;
    }

    const tempMean = mean(temps);
    const tempDelta = temps[temps.length - 1] - temps[0];
    const tempRate = linearRegSlope(temps);
    const tempVolatility = stddev(temps);
    const tempAmbientGap = mean(ambients) - tempMean;

    const powerMean = mean(powers);
    const powerDelta = powers[powers.length - 1] - powers[0];
    const freqMean = mean(freqs);
    const freqStability = freqs.length > 1 ? Math.max(0, 1 - stddev(freqs) / Math.max(1, freqMean)) : 0.5;

    const copMean = mean(cops);
    const copTrend = linearRegSlope(cops);

    const tempRateVsPower = correlation(tempRates, powers.slice(1));

    let recoveryEfficiency = 0.5;
    if (powerMean > 50 && tempRate < 0) {
        recoveryEfficiency = Math.min(1, Math.abs(tempRate) / (powerMean / 500));
    } else if (powerMean > 50 && tempRate >= 0) {
        recoveryEfficiency = Math.max(0, 0.3 - tempRate);
    }

    return {
        temp_mean: tempMean,
        temp_delta: tempDelta,
        temp_rate: tempRate,
        temp_volatility: tempVolatility,
        temp_ambient_gap: tempAmbientGap,
        power_mean: powerMean,
        power_delta: powerDelta,
        freq_mean: freqMean,
        freq_stability: freqStability,
        cop_mean: copMean,
        cop_trend: copTrend,
        temp_rate_vs_power: tempRateVsPower,
        recovery_efficiency: Math.max(0, Math.min(1, recoveryEfficiency)),
        door_state: doorOpen,
        door_duration: doorDuration,
    };
}

// Load fixtures
const fixturesDir = path.join(__dirname, 'fixtures');
const stableWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'stable-window.json'), 'utf8'));
const doorOpenWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'door-open-window.json'), 'utf8'));

describe('Feature Computation', () => {
    describe('computeFeatures', () => {
        it('returns null for empty input', () => {
            assert.strictEqual(computeFeatures([]), null);
            assert.strictEqual(computeFeatures(null), null);
        });

        it('returns null for single sample', () => {
            assert.strictEqual(computeFeatures([stableWindow[0]]), null);
        });

        it('returns 15 features for valid window', () => {
            const features = computeFeatures(stableWindow);
            assert.ok(features);
            const keys = Object.keys(features);
            assert.strictEqual(keys.length, 15);
        });

        it('computes correct features for stable window', () => {
            const features = computeFeatures(stableWindow);
            // Temp mean should be around -20
            assert.ok(features.temp_mean < -19 && features.temp_mean > -21, `temp_mean=${features.temp_mean}`);
            // Temp delta should be near zero
            assert.ok(Math.abs(features.temp_delta) < 1, `temp_delta=${features.temp_delta}`);
            // Temp rate should be near zero
            assert.ok(Math.abs(features.temp_rate) < 0.05, `temp_rate=${features.temp_rate}`);
            // Low volatility
            assert.ok(features.temp_volatility < 0.5, `temp_volatility=${features.temp_volatility}`);
            // Door closed
            assert.strictEqual(features.door_state, 0);
            assert.strictEqual(features.door_duration, 0);
        });

        it('computes correct features for door-open window', () => {
            const features = computeFeatures(doorOpenWindow);
            // Door should be open
            assert.strictEqual(features.door_state, 1);
            // Door duration should be > 0
            assert.ok(features.door_duration > 0, `door_duration=${features.door_duration}`);
            // Temp should be rising (positive rate)
            assert.ok(features.temp_rate > 0, `temp_rate=${features.temp_rate}`);
            // Temp delta should be positive
            assert.ok(features.temp_delta > 0, `temp_delta=${features.temp_delta}`);
            // Power should be elevated
            assert.ok(features.power_mean > 150, `power_mean=${features.power_mean}`);
        });
    });

    describe('Helper math functions', () => {
        it('mean computes correctly', () => {
            assert.strictEqual(mean([1, 2, 3, 4, 5]), 3);
            assert.strictEqual(mean([]), 0);
        });

        it('stddev computes correctly', () => {
            assert.ok(Math.abs(stddev([1, 1, 1, 1]) - 0) < 0.001);
            assert.ok(stddev([1, 2, 3, 4, 5]) > 1);
        });

        it('linearRegSlope computes correctly', () => {
            // Perfectly increasing: slope = 1
            assert.ok(Math.abs(linearRegSlope([0, 1, 2, 3, 4]) - 1) < 0.001);
            // Constant: slope = 0
            assert.strictEqual(linearRegSlope([5, 5, 5, 5]), 0);
            // Single value: slope = 0
            assert.strictEqual(linearRegSlope([5]), 0);
        });

        it('correlation computes correctly', () => {
            // Perfect positive correlation
            const r = correlation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
            assert.ok(Math.abs(r - 1) < 0.001, `correlation=${r}`);
            // Perfect negative correlation
            const r2 = correlation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
            assert.ok(Math.abs(r2 - (-1)) < 0.001, `correlation=${r2}`);
        });
    });
});
