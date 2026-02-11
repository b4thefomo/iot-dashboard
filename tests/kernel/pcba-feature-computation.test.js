const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Re-implement PCBA feature computation for testing (mirrors server.js logic).
// PCBA blocks have: temp, block_rms, block_dom_freq, block_spectral_entropy,
// door_angle_deg, door_open_duration_s, timestamp

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

function computePcbaFeatures(blockWindow) {
    if (!blockWindow || blockWindow.length < 2) return null;

    const temps = blockWindow.map(b => b.temp);
    const rmsValues = blockWindow.map(b => b.block_rms);
    const domFreqs = blockWindow.map(b => b.block_dom_freq);
    const entropies = blockWindow.map(b => b.block_spectral_entropy);

    const lastBlock = blockWindow[blockWindow.length - 1];

    // Temperature domain (4 features)
    const tempMean = mean(temps);
    const tempDelta = temps[temps.length - 1] - temps[0];
    const tempRate = linearRegSlope(temps);
    const tempVolatility = stddev(temps);

    // Vibration domain (6 features)
    const vibRms = mean(rmsValues);
    const vibRmsDelta = rmsValues[rmsValues.length - 1] - rmsValues[0];
    const vibDomFreq = mean(domFreqs);
    const freqMean = mean(domFreqs);
    const freqStd = stddev(domFreqs);
    const vibSpectralStability = freqMean > 0 ? Math.max(0, Math.min(1, 1 - freqStd / freqMean)) : 0;
    const vibSpectralEntropy = mean(entropies);

    // Duty cycle: fraction of blocks where vib_rms > noise threshold (0.1)
    const NOISE_THRESHOLD = 0.1;
    const activeBlocks = rmsValues.filter(r => r > NOISE_THRESHOLD).length;
    const vibDutyCycle = rmsValues.length > 0 ? activeBlocks / rmsValues.length : 0;

    // Door domain (2 features) — accelerometer gravity vector derived
    const doorAngleDeg = Number.isFinite(lastBlock.door_angle_deg) ? lastBlock.door_angle_deg : 0;
    const doorAngleNorm = Math.max(0, Math.min(1, doorAngleDeg / 180));
    const doorOpenDuration = lastBlock.door_open_duration_s || 0;

    // Cross-domain (2 features)
    // cooling_efficiency_proxy: |temp_rate| / (vib_rms + epsilon) when duty_cycle > 0.3
    const epsilon = 0.01;
    let coolingEfficiencyProxy = 0;
    if (vibDutyCycle > 0.3 && vibRms > epsilon) {
        coolingEfficiencyProxy = Math.min(1, Math.abs(tempRate) / (vibRms + epsilon));
    }

    // temp_rate_vs_vib: correlation of per-block temp rates with block_rms
    const tempRates = [];
    for (let i = 1; i < temps.length; i++) {
        tempRates.push(temps[i] - temps[i - 1]);
    }
    const tempRateVsVib = correlation(tempRates, rmsValues.slice(1));

    return {
        temp_mean: tempMean,
        temp_delta: tempDelta,
        temp_rate: tempRate,
        temp_volatility: tempVolatility,
        vib_rms: vibRms,
        vib_rms_delta: vibRmsDelta,
        vib_dom_freq: vibDomFreq,
        vib_spectral_stability: vibSpectralStability,
        vib_spectral_entropy: vibSpectralEntropy,
        vib_duty_cycle: vibDutyCycle,
        door_angle_norm: doorAngleNorm,
        door_open_duration: doorOpenDuration,
        cooling_efficiency_proxy: Math.max(0, Math.min(1, coolingEfficiencyProxy)),
        temp_rate_vs_vib: tempRateVsVib,
    };
}

// Load PCBA fixtures
const fixturesDir = path.join(__dirname, 'fixtures');
const pcbaStableWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-stable-window.json'), 'utf8'));
const pcbaDoorOpenWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-door-open-window.json'), 'utf8'));
const pcbaCompStressWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-compstress-window.json'), 'utf8'));
const pcbaDefrostWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-defrost-window.json'), 'utf8'));
const pcbaExcursionWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-excursion-window.json'), 'utf8'));

describe('PCBA Feature Computation', () => {
    describe('computePcbaFeatures', () => {
        it('returns null for empty input', () => {
            assert.strictEqual(computePcbaFeatures([]), null);
            assert.strictEqual(computePcbaFeatures(null), null);
        });

        it('returns null for single sample', () => {
            assert.strictEqual(computePcbaFeatures([pcbaStableWindow[0]]), null);
        });

        it('returns 14 features for valid window', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            assert.ok(features);
            const keys = Object.keys(features);
            assert.strictEqual(keys.length, 14);
            // Check all expected keys present
            const expectedKeys = [
                'temp_mean', 'temp_delta', 'temp_rate', 'temp_volatility',
                'vib_rms', 'vib_rms_delta', 'vib_dom_freq', 'vib_spectral_stability',
                'vib_spectral_entropy', 'vib_duty_cycle',
                'door_angle_norm', 'door_open_duration',
                'cooling_efficiency_proxy', 'temp_rate_vs_vib'
            ];
            for (const key of expectedKeys) {
                assert.ok(key in features, `missing key: ${key}`);
            }
        });

        it('computes vib_rms from accel blocks', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable window has block_rms around 0.29-0.31, mean should be ~0.30
            assert.ok(features.vib_rms > 0.28 && features.vib_rms < 0.32, `vib_rms=${features.vib_rms}`);
        });

        it('computes vib_rms_delta over window', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable: last rms (0.30) - first rms (0.30) ≈ 0
            assert.ok(Math.abs(features.vib_rms_delta) < 0.05, `vib_rms_delta=${features.vib_rms_delta}`);

            // Door open: vibration increases from 0.32 to 0.43
            const doorFeatures = computePcbaFeatures(pcbaDoorOpenWindow);
            assert.ok(doorFeatures.vib_rms_delta > 0.1, `door vib_rms_delta=${doorFeatures.vib_rms_delta}`);
        });

        it('computes vib_dom_freq via mean of block dominant frequencies', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable window has dom_freq around 50 Hz
            assert.ok(features.vib_dom_freq > 49 && features.vib_dom_freq < 51, `vib_dom_freq=${features.vib_dom_freq}`);
        });

        it('computes vib_spectral_stability', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable: freqs barely vary around 50, stability should be high (>0.9)
            assert.ok(features.vib_spectral_stability > 0.9, `vib_spectral_stability=${features.vib_spectral_stability}`);

            // Comp stress: freq varies (58-67), stability should be lower than stable
            const stressFeatures = computePcbaFeatures(pcbaCompStressWindow);
            assert.ok(stressFeatures.vib_spectral_stability < features.vib_spectral_stability,
                `stress stability ${stressFeatures.vib_spectral_stability} should be < stable ${features.vib_spectral_stability}`);
        });

        it('computes vib_spectral_entropy', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable: entropy around 2.2-2.4
            assert.ok(features.vib_spectral_entropy > 2.0 && features.vib_spectral_entropy < 2.6, `vib_spectral_entropy=${features.vib_spectral_entropy}`);

            // Comp stress: entropy around 3.8-4.3 (high)
            const stressFeatures = computePcbaFeatures(pcbaCompStressWindow);
            assert.ok(stressFeatures.vib_spectral_entropy > 3.5, `stress vib_spectral_entropy=${stressFeatures.vib_spectral_entropy}`);
        });

        it('computes vib_duty_cycle', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // All blocks have rms > 0.1, so duty_cycle = 1.0
            assert.strictEqual(features.vib_duty_cycle, 1.0);

            // Defrost window: most blocks have rms < 0.1 (compressor off)
            const defrostFeatures = computePcbaFeatures(pcbaDefrostWindow);
            assert.ok(defrostFeatures.vib_duty_cycle < 0.3, `defrost vib_duty_cycle=${defrostFeatures.vib_duty_cycle}`);
        });

        it('computes temp features from window', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Temp mean around -20
            assert.ok(features.temp_mean < -19 && features.temp_mean > -21, `temp_mean=${features.temp_mean}`);
            // Near-zero delta
            assert.ok(Math.abs(features.temp_delta) < 1, `temp_delta=${features.temp_delta}`);
            // Near-zero rate
            assert.ok(Math.abs(features.temp_rate) < 0.05, `temp_rate=${features.temp_rate}`);
            // Low volatility
            assert.ok(features.temp_volatility < 0.5, `temp_volatility=${features.temp_volatility}`);
        });

        it('computes door features from accelerometer angle', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable: door_angle_deg ~1.5° → door_angle_norm ~0.008
            assert.ok(features.door_angle_norm < 0.15, `door_angle_norm=${features.door_angle_norm}`);
            assert.strictEqual(features.door_open_duration, 0);

            const doorFeatures = computePcbaFeatures(pcbaDoorOpenWindow);
            // Door open: last block door_angle_deg ~93° → door_angle_norm ~0.517
            assert.ok(doorFeatures.door_angle_norm > 0.15, `door_angle_norm=${doorFeatures.door_angle_norm}`);
            assert.ok(doorFeatures.door_open_duration > 0, `door_open_duration=${doorFeatures.door_open_duration}`);
        });

        it('computes cooling_efficiency_proxy', () => {
            // Stable: low temp_rate, moderate vib_rms, duty > 0.3 → low efficiency proxy
            const features = computePcbaFeatures(pcbaStableWindow);
            assert.ok(features.cooling_efficiency_proxy >= 0 && features.cooling_efficiency_proxy <= 1,
                `cooling_efficiency_proxy=${features.cooling_efficiency_proxy}`);

            // Defrost: duty_cycle < 0.3, so proxy should be 0
            const defrostFeatures = computePcbaFeatures(pcbaDefrostWindow);
            assert.strictEqual(defrostFeatures.cooling_efficiency_proxy, 0);
        });

        it('computes temp_rate_vs_vib correlation', () => {
            const features = computePcbaFeatures(pcbaStableWindow);
            // Stable: should be near zero (no correlation)
            assert.ok(typeof features.temp_rate_vs_vib === 'number');
        });

        it('handles empty window gracefully', () => {
            assert.strictEqual(computePcbaFeatures([]), null);
            assert.strictEqual(computePcbaFeatures(undefined), null);
        });

        it('handles window with all-zero vibration', () => {
            const zeroVibWindow = pcbaStableWindow.map(b => ({
                ...b,
                block_rms: 0,
                block_dom_freq: 0,
                block_spectral_entropy: 0
            }));
            const features = computePcbaFeatures(zeroVibWindow);
            assert.ok(features);
            assert.strictEqual(features.vib_rms, 0);
            assert.strictEqual(features.vib_dom_freq, 0);
            assert.strictEqual(features.vib_spectral_entropy, 0);
            assert.strictEqual(features.vib_duty_cycle, 0);
            assert.strictEqual(features.vib_spectral_stability, 0); // freqMean=0 → stability=0
            assert.strictEqual(features.cooling_efficiency_proxy, 0); // duty < 0.3
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
            assert.ok(Math.abs(linearRegSlope([0, 1, 2, 3, 4]) - 1) < 0.001);
            assert.strictEqual(linearRegSlope([5, 5, 5, 5]), 0);
            assert.strictEqual(linearRegSlope([5]), 0);
        });

        it('correlation computes correctly', () => {
            const r = correlation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
            assert.ok(Math.abs(r - 1) < 0.001, `correlation=${r}`);
            const r2 = correlation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
            assert.ok(Math.abs(r2 - (-1)) < 0.001, `correlation=${r2}`);
        });
    });
});
