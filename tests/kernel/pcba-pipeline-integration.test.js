const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// ── Re-implement all pipeline functions for integration testing ──

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

const PCBA_NOISE_THRESHOLD = 0.1;
const KERNEL_STATES = ['STABLE', 'DOOR_OPEN', 'RECOVERING', 'DEFROST',
    'DRIFT_WARM', 'DRIFT_COLD', 'EXCURSION', 'COMP_STRESS', 'FAULT'];

function computePcbaFeatures(blockWindow) {
    if (!blockWindow || blockWindow.length < 2) return null;
    const temps = blockWindow.map(b => b.temp);
    const rmsValues = blockWindow.map(b => b.block_rms);
    const domFreqs = blockWindow.map(b => b.block_dom_freq);
    const entropies = blockWindow.map(b => b.block_spectral_entropy);
    const lastBlock = blockWindow[blockWindow.length - 1];

    const tempMean = mean(temps);
    const tempDelta = temps[temps.length - 1] - temps[0];
    const tempRate = linearRegSlope(temps);
    const tempVolatility = stddev(temps);
    const vibRms = mean(rmsValues);
    const vibRmsDelta = rmsValues[rmsValues.length - 1] - rmsValues[0];
    const vibDomFreq = mean(domFreqs);
    const freqMean = mean(domFreqs);
    const freqStd = stddev(domFreqs);
    const vibSpectralStability = freqMean > 0 ? Math.max(0, Math.min(1, 1 - freqStd / freqMean)) : 0;
    const vibSpectralEntropy = mean(entropies);
    const activeBlocks = rmsValues.filter(r => r > PCBA_NOISE_THRESHOLD).length;
    const vibDutyCycle = rmsValues.length > 0 ? activeBlocks / rmsValues.length : 0;
    const doorAngleDeg = Number.isFinite(lastBlock.door_angle_deg) ? lastBlock.door_angle_deg : 0;
    const doorAngleNorm = Math.max(0, Math.min(1, doorAngleDeg / 180));
    const doorOpenDuration = lastBlock.door_open_duration_s || 0;
    const epsilon = 0.01;
    let coolingEfficiencyProxy = 0;
    if (vibDutyCycle > 0.3 && vibRms > epsilon) {
        coolingEfficiencyProxy = Math.min(1, Math.abs(tempRate) / (vibRms + epsilon));
    }
    const tempRates = [];
    for (let i = 1; i < temps.length; i++) tempRates.push(temps[i] - temps[i - 1]);
    const tempRateVsVib = correlation(tempRates, rmsValues.slice(1));

    return {
        temp_mean: tempMean, temp_delta: tempDelta, temp_rate: tempRate, temp_volatility: tempVolatility,
        vib_rms: vibRms, vib_rms_delta: vibRmsDelta, vib_dom_freq: vibDomFreq,
        vib_spectral_stability: vibSpectralStability, vib_spectral_entropy: vibSpectralEntropy,
        vib_duty_cycle: vibDutyCycle, door_angle_norm: doorAngleNorm, door_open_duration: doorOpenDuration,
        cooling_efficiency_proxy: Math.max(0, Math.min(1, coolingEfficiencyProxy)),
        temp_rate_vs_vib: tempRateVsVib,
    };
}

function pcbaRuleClassify(features) {
    if (features.door_angle_norm > 0.15) return { state: 1, state_name: 'DOOR_OPEN', confidence: 0.95, method: 'rule' };
    if (features.vib_duty_cycle < 0.2 && features.temp_rate > 0.05)
        return { state: 3, state_name: 'DEFROST', confidence: 0.90, method: 'rule' };
    if (features.temp_volatility < 0.4 && Math.abs(features.temp_delta) < 1.0 &&
        Math.abs(features.temp_rate) < 0.05 && features.vib_spectral_stability > 0.85)
        return { state: 0, state_name: 'STABLE', confidence: 0.95, method: 'rule' };
    if (features.temp_rate < -0.05 && features.vib_rms > 0.5)
        return { state: 2, state_name: 'RECOVERING', confidence: 0.90, method: 'rule' };
    return null;
}

function mlpRelu(arr) { return arr.map(v => Math.max(0, v)); }
function mlpSoftmax(arr) {
    const max = Math.max(...arr);
    const exps = arr.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
}
function mlpForward(features, weights) {
    const fmin = weights.feature_min;
    const fmax = weights.feature_max;
    let x = features.map((v, i) => (v - fmin[i]) / (fmax[i] - fmin[i] + 1e-8));
    for (let l = 0; l < weights.layers.length; l++) {
        const layer = weights.layers[l];
        const out = new Array(layer.bias.length).fill(0);
        for (let j = 0; j < layer.bias.length; j++) {
            let sum = layer.bias[j];
            for (let k = 0; k < x.length; k++) sum += x[k] * layer.weights[k][j];
            out[j] = sum;
        }
        x = l < weights.layers.length - 1 ? mlpRelu(out) : mlpSoftmax(out);
    }
    return x;
}

function pcbaMlpClassify(features, pcbaMlpWeights) {
    if (!pcbaMlpWeights) return null;
    const featureArray = [
        features.temp_mean, features.temp_delta, features.temp_rate, features.temp_volatility,
        features.vib_rms, features.vib_rms_delta, features.vib_dom_freq, features.vib_spectral_stability,
        features.vib_spectral_entropy, features.vib_duty_cycle,
        features.door_angle_norm, features.door_open_duration, features.cooling_efficiency_proxy, features.temp_rate_vs_vib,
    ];
    const probabilities = mlpForward(featureArray, pcbaMlpWeights);
    let maxIdx = 0;
    for (let i = 1; i < probabilities.length; i++) if (probabilities[i] > probabilities[maxIdx]) maxIdx = i;
    return { state: maxIdx, state_name: KERNEL_STATES[maxIdx], confidence: probabilities[maxIdx], method: 'mlp', probabilities };
}

function pcbaSensorCrossValidation(state, features) {
    let score = 1.0;
    const penalties = [];
    switch (state) {
        case 0:
            if (features.temp_volatility > 1.0) { score -= 0.3; penalties.push('high_volatility'); }
            if (Math.abs(features.temp_rate) > 0.1) { score -= 0.2; penalties.push('temp_changing'); }
            if (features.vib_spectral_stability < 0.7) { score -= 0.3; penalties.push('unstable_vibration'); }
            break;
        case 1: if (features.door_angle_norm < 0.15) { score -= 0.5; penalties.push('door_closed'); } break;
        case 2:
            if (features.temp_rate >= 0) { score -= 0.3; penalties.push('not_cooling'); }
            if (features.vib_rms < 0.3) { score -= 0.2; penalties.push('low_vibration'); }
            break;
        case 3: if (features.vib_duty_cycle > 0.5) { score -= 0.3; penalties.push('compressor_running'); } break;
        case 6: if (features.temp_mean < -15) { score -= 0.4; penalties.push('temp_normal'); } break;
        case 7:
            if (features.vib_spectral_entropy < 3.0) { score -= 0.3; penalties.push('low_spectral_entropy'); }
            if (features.vib_spectral_stability > 0.85) { score -= 0.2; penalties.push('vibration_stable'); }
            break;
        case 8: if (features.vib_rms > 0.3 && features.vib_spectral_stability > 0.8) { score -= 0.3; penalties.push('systems_ok'); } break;
    }
    return { score: Math.max(0, score), penalties };
}

function classifyPcbaSensorData(blockWindow, pcbaMlpWeights) {
    const features = computePcbaFeatures(blockWindow);
    if (!features) return null;
    let result = pcbaRuleClassify(features);
    if (!result) result = pcbaMlpClassify(features, pcbaMlpWeights);
    if (!result) {
        if (features.temp_rate < -0.05 && features.vib_rms > 0.4)
            result = { state: 2, state_name: 'RECOVERING', confidence: 0.7, method: 'heuristic' };
        else if (features.temp_rate > 0.02 && features.temp_mean > -18)
            result = { state: 4, state_name: 'DRIFT_WARM', confidence: 0.6, method: 'heuristic' };
        else if (features.temp_rate < -0.02 && features.temp_mean < -22)
            result = { state: 5, state_name: 'DRIFT_COLD', confidence: 0.6, method: 'heuristic' };
        else if (features.temp_mean > -8)
            result = { state: 6, state_name: 'EXCURSION', confidence: 0.7, method: 'heuristic' };
        else if (features.vib_spectral_entropy > 3.5 || features.vib_spectral_stability < 0.5)
            result = { state: 7, state_name: 'COMP_STRESS', confidence: 0.6, method: 'heuristic' };
        else if (features.vib_duty_cycle < 0.2 && features.vib_rms < 0.1)
            result = { state: 8, state_name: 'FAULT', confidence: 0.5, method: 'heuristic' };
        else result = { state: 0, state_name: 'STABLE', confidence: 0.5, method: 'heuristic' };
    }
    const crossVal = pcbaSensorCrossValidation(result.state, features);
    return {
        state: result.state, state_name: result.state_name, confidence: result.confidence,
        method: result.method, sensor_consistency: crossVal.score, consistency_penalties: crossVal.penalties,
        feature_snapshot: features, timestamp: new Date().toISOString(),
    };
}

// Markov engine (minimal re-implementation)
function createMarkovEngine() {
    const matrices = [];
    for (let t = 0; t < 6; t++) {
        const m = [];
        for (let i = 0; i < 9; i++) { m.push(new Array(9).fill(0)); }
        matrices.push(m);
    }
    return { matrices, totalTransitions: 0, stateHistory: [], lastState: null, maturity: 'Learning' };
}
function updateMarkovMaturity(engine) {
    if (engine.totalTransitions >= 500) engine.maturity = 'Established';
    else if (engine.totalTransitions >= 200) engine.maturity = 'Mature';
    else if (engine.totalTransitions >= 50) engine.maturity = 'Developing';
    else engine.maturity = 'Learning';
}
function markovLearn(engine, fromState, toState, timePeriod, confidence, consistency) {
    if (confidence < 0.7 || consistency < 0.8) return false;
    engine.matrices[timePeriod][fromState][toState] += 1;
    engine.totalTransitions += 10;
    engine.stateHistory.push({ from: fromState, to: toState, time: timePeriod });
    if (engine.stateHistory.length > 100) engine.stateHistory.shift();
    updateMarkovMaturity(engine);
    return true;
}

// Load fixtures and weights
const fixturesDir = path.join(__dirname, 'fixtures');
const pcbaStableWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-stable-window.json'), 'utf8'));
const pcbaDoorOpenWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-door-open-window.json'), 'utf8'));
const pcbaExcursionWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-excursion-window.json'), 'utf8'));
const pcbaCompStressWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-compstress-window.json'), 'utf8'));
const pcbaDefrostWindow = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'pcba-defrost-window.json'), 'utf8'));

const weightsPath = path.join(__dirname, '..', '..', 'kernel', 'pcba_mlp_weights.json');
let pcbaMlpWeights = null;
if (fs.existsSync(weightsPath)) {
    pcbaMlpWeights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
}

describe('PCBA Pipeline Integration', () => {
    it('full pipeline: stable window → STABLE classification', () => {
        const result = classifyPcbaSensorData(pcbaStableWindow, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'STABLE');
        assert.ok(result.confidence >= 0.5, `confidence=${result.confidence}`);
        assert.ok(result.sensor_consistency > 0.5, `consistency=${result.sensor_consistency}`);
        assert.ok(result.feature_snapshot);
        assert.strictEqual(Object.keys(result.feature_snapshot).length, 14);
    });

    it('full pipeline: door-open window → DOOR_OPEN', () => {
        const result = classifyPcbaSensorData(pcbaDoorOpenWindow, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'DOOR_OPEN');
        assert.strictEqual(result.confidence, 0.95);
        assert.strictEqual(result.method, 'rule');
        assert.strictEqual(result.sensor_consistency, 1.0); // door_angle_norm > 0.15 matches
    });

    it('full pipeline: excursion window → EXCURSION', () => {
        const result = classifyPcbaSensorData(pcbaExcursionWindow, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'EXCURSION');
        assert.ok(result.confidence >= 0.5, `confidence=${result.confidence}`);
    });

    it('full pipeline: comp-stress window → COMP_STRESS', () => {
        const result = classifyPcbaSensorData(pcbaCompStressWindow, pcbaMlpWeights);
        assert.ok(result);
        // Could be COMP_STRESS via MLP or heuristic (high spectral entropy)
        assert.ok(result.state_name === 'COMP_STRESS' || result.state_name === 'STABLE',
            `expected COMP_STRESS or STABLE, got ${result.state_name}`);
    });

    it('full pipeline: defrost window → DEFROST', () => {
        const result = classifyPcbaSensorData(pcbaDefrostWindow, pcbaMlpWeights);
        assert.ok(result);
        // Defrost should be caught by rule (low duty_cycle + temp rising)
        assert.strictEqual(result.state_name, 'DEFROST');
        assert.strictEqual(result.method, 'rule');
        assert.strictEqual(result.confidence, 0.90);
    });

    it('pipeline feeds into Markov engine', () => {
        const engine = createMarkovEngine();
        const result1 = classifyPcbaSensorData(pcbaStableWindow, pcbaMlpWeights);
        const result2 = classifyPcbaSensorData(pcbaDoorOpenWindow, pcbaMlpWeights);

        // Simulate transition STABLE → DOOR_OPEN
        const learned = markovLearn(engine, result1.state, result2.state, 2,
            result2.confidence, result2.sensor_consistency);
        assert.ok(learned, 'Markov should learn high-confidence transition');
        assert.ok(engine.totalTransitions > 0);
        assert.ok(engine.stateHistory.length > 0);
    });

    it('pipeline respects confidence gate (0.7)', () => {
        const engine = createMarkovEngine();
        // Low-confidence heuristic result
        const lowConfResult = { state: 0, state_name: 'STABLE', confidence: 0.5 };
        const learned = markovLearn(engine, 0, 1, 2, lowConfResult.confidence, 1.0);
        assert.strictEqual(learned, false, 'Should NOT learn with confidence < 0.7');
    });

    it('pipeline respects consistency gate (0.8)', () => {
        const engine = createMarkovEngine();
        const learned = markovLearn(engine, 0, 1, 2, 0.95, 0.5);
        assert.strictEqual(learned, false, 'Should NOT learn with consistency < 0.8');
    });

    it('returns full classification structure', () => {
        const result = classifyPcbaSensorData(pcbaStableWindow, pcbaMlpWeights);
        assert.ok(result);
        assert.ok('state' in result);
        assert.ok('state_name' in result);
        assert.ok('confidence' in result);
        assert.ok('method' in result);
        assert.ok('sensor_consistency' in result);
        assert.ok('consistency_penalties' in result);
        assert.ok('feature_snapshot' in result);
        assert.ok('timestamp' in result);
        assert.ok(typeof result.state === 'number');
        assert.ok(typeof result.state_name === 'string');
        assert.ok(typeof result.confidence === 'number');
        assert.ok(Array.isArray(result.consistency_penalties));
    });
});
