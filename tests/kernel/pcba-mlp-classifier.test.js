const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// MLP forward pass helpers (mirrors server.js)
function mlpRelu(arr) {
    return arr.map(v => Math.max(0, v));
}

function mlpSoftmax(arr) {
    const max = Math.max(...arr);
    const exps = arr.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
}

function mlpForward(features, weights) {
    // Normalize
    const fmin = weights.feature_min;
    const fmax = weights.feature_max;
    let x = features.map((v, i) => (v - fmin[i]) / (fmax[i] - fmin[i] + 1e-8));

    // Forward pass through layers
    for (let l = 0; l < weights.layers.length; l++) {
        const layer = weights.layers[l];
        const w = layer.weights;
        const b = layer.bias;
        const out = new Array(b.length).fill(0);

        for (let j = 0; j < b.length; j++) {
            let sum = b[j];
            for (let k = 0; k < x.length; k++) {
                sum += x[k] * w[k][j];
            }
            out[j] = sum;
        }

        // Apply activation
        if (l < weights.layers.length - 1) {
            x = mlpRelu(out);
        } else {
            x = mlpSoftmax(out);
        }
    }
    return x;
}

function pcbaMlpClassify(features, pcbaMlpWeights) {
    if (!pcbaMlpWeights) return null;

    const KERNEL_STATES = ['STABLE', 'DOOR_OPEN', 'RECOVERING', 'DEFROST',
        'DRIFT_WARM', 'DRIFT_COLD', 'EXCURSION', 'COMP_STRESS', 'FAULT'];

    const featureArray = [
        features.temp_mean, features.temp_delta, features.temp_rate, features.temp_volatility,
        features.vib_rms, features.vib_rms_delta, features.vib_dom_freq, features.vib_spectral_stability,
        features.vib_spectral_entropy, features.vib_duty_cycle,
        features.door_angle_norm, features.door_open_duration,
        features.cooling_efficiency_proxy, features.temp_rate_vs_vib,
    ];

    const probabilities = mlpForward(featureArray, pcbaMlpWeights);
    if (!probabilities) return null;

    let maxIdx = 0;
    for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > probabilities[maxIdx]) maxIdx = i;
    }

    return {
        state: maxIdx,
        state_name: KERNEL_STATES[maxIdx],
        confidence: probabilities[maxIdx],
        method: 'mlp',
        probabilities: probabilities,
    };
}

// Load weights
const weightsPath = path.join(__dirname, '..', '..', 'kernel', 'pcba_mlp_weights.json');
let pcbaMlpWeights = null;

describe('PCBA MLP Classifier', () => {
    before(() => {
        if (fs.existsSync(weightsPath)) {
            pcbaMlpWeights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
        }
    });

    it('loads pcba_mlp_weights.json successfully', () => {
        assert.ok(pcbaMlpWeights, 'Weights file should exist at kernel/pcba_mlp_weights.json');
        assert.strictEqual(pcbaMlpWeights.n_features, 14);
        assert.strictEqual(pcbaMlpWeights.n_classes, 9);
        assert.strictEqual(pcbaMlpWeights.layers.length, 3);
        assert.strictEqual(pcbaMlpWeights.layers[0].input_shape, 14);
        assert.strictEqual(pcbaMlpWeights.layers[0].output_shape, 32);
        assert.strictEqual(pcbaMlpWeights.layers[1].input_shape, 32);
        assert.strictEqual(pcbaMlpWeights.layers[1].output_shape, 16);
        assert.strictEqual(pcbaMlpWeights.layers[2].input_shape, 16);
        assert.strictEqual(pcbaMlpWeights.layers[2].output_shape, 9);
    });

    it('forward pass returns 9 probabilities summing to ~1.0', () => {
        if (!pcbaMlpWeights) return;
        // Stable-like features
        const features = {
            temp_mean: -20, temp_delta: 0, temp_rate: 0, temp_volatility: 0.1,
            vib_rms: 0.42, vib_rms_delta: 0, vib_dom_freq: 50, vib_spectral_stability: 0.95,
            vib_spectral_entropy: 2.1, vib_duty_cycle: 0.95,
            door_angle_norm: 0.01, door_open_duration: 0,
            cooling_efficiency_proxy: 0.8, temp_rate_vs_vib: 0,
        };
        const result = pcbaMlpClassify(features, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.probabilities.length, 9);
        const sum = result.probabilities.reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(sum - 1.0) < 0.01, `probabilities sum=${sum}`);
    });

    it('classifies stable features as STABLE', () => {
        if (!pcbaMlpWeights) return;
        const features = {
            temp_mean: -20, temp_delta: 0.1, temp_rate: 0.005, temp_volatility: 0.1,
            vib_rms: 0.42, vib_rms_delta: 0.01, vib_dom_freq: 50, vib_spectral_stability: 0.95,
            vib_spectral_entropy: 2.1, vib_duty_cycle: 0.95,
            door_angle_norm: 0.01, door_open_duration: 0,
            cooling_efficiency_proxy: 0.8, temp_rate_vs_vib: 0.0,
        };
        const result = pcbaMlpClassify(features, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'STABLE');
        assert.ok(result.confidence > 0.5, `confidence=${result.confidence}`);
    });

    it('classifies excursion features as EXCURSION', () => {
        if (!pcbaMlpWeights) return;
        const features = {
            temp_mean: -3, temp_delta: 8, temp_rate: 0.3, temp_volatility: 2.0,
            vib_rms: 0.65, vib_rms_delta: 0.1, vib_dom_freq: 60, vib_spectral_stability: 0.70,
            vib_spectral_entropy: 3.0, vib_duty_cycle: 0.98,
            door_angle_norm: 0.01, door_open_duration: 0,
            cooling_efficiency_proxy: 0.15, temp_rate_vs_vib: 0.7,
        };
        const result = pcbaMlpClassify(features, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'EXCURSION');
        assert.ok(result.confidence > 0.5, `confidence=${result.confidence}`);
    });

    it('classifies comp_stress features as COMP_STRESS', () => {
        if (!pcbaMlpWeights) return;
        const features = {
            temp_mean: -18, temp_delta: 0.5, temp_rate: 0.01, temp_volatility: 0.5,
            vib_rms: 0.75, vib_rms_delta: 0.15, vib_dom_freq: 62, vib_spectral_stability: 0.55,
            vib_spectral_entropy: 3.8, vib_duty_cycle: 0.92,
            door_angle_norm: 0.01, door_open_duration: 0,
            cooling_efficiency_proxy: 0.35, temp_rate_vs_vib: 0.1,
        };
        const result = pcbaMlpClassify(features, pcbaMlpWeights);
        assert.ok(result);
        assert.strictEqual(result.state_name, 'COMP_STRESS');
        assert.ok(result.confidence > 0.3, `confidence=${result.confidence}`);
    });

    it('normalizes inputs using min-max params', () => {
        if (!pcbaMlpWeights) return;
        assert.ok(Array.isArray(pcbaMlpWeights.feature_min));
        assert.ok(Array.isArray(pcbaMlpWeights.feature_max));
        assert.strictEqual(pcbaMlpWeights.feature_min.length, 14);
        assert.strictEqual(pcbaMlpWeights.feature_max.length, 14);
        // Verify min < max for each feature
        for (let i = 0; i < 14; i++) {
            assert.ok(pcbaMlpWeights.feature_min[i] < pcbaMlpWeights.feature_max[i],
                `feature ${i}: min=${pcbaMlpWeights.feature_min[i]} >= max=${pcbaMlpWeights.feature_max[i]}`);
        }
    });

    it('handles missing weights gracefully', () => {
        const result = pcbaMlpClassify({
            temp_mean: -20, temp_delta: 0, temp_rate: 0, temp_volatility: 0.1,
            vib_rms: 0.42, vib_rms_delta: 0, vib_dom_freq: 50, vib_spectral_stability: 0.95,
            vib_spectral_entropy: 2.1, vib_duty_cycle: 0.95,
            door_angle_norm: 0.01, door_open_duration: 0,
            cooling_efficiency_proxy: 0.8, temp_rate_vs_vib: 0,
        }, null);
        assert.strictEqual(result, null);
    });
});
