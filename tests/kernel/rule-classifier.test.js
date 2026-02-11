const { describe, it } = require('node:test');
const assert = require('node:assert');

// Re-implement rule classifier for testing (mirrors server.js logic)
function ruleClassify(features, lastSample) {
    if (lastSample.fault && lastSample.fault !== 'NORMAL') {
        return { state: 8, state_name: 'FAULT', confidence: 1.0, method: 'rule' };
    }
    if (lastSample.defrost_on) {
        return { state: 3, state_name: 'DEFROST', confidence: 1.0, method: 'rule' };
    }
    if (features.door_state === 1.0) {
        return { state: 1, state_name: 'DOOR_OPEN', confidence: 1.0, method: 'rule' };
    }
    if (features.temp_volatility < 0.4 && Math.abs(features.temp_delta) < 1.0 && Math.abs(features.temp_rate) < 0.05) {
        return { state: 0, state_name: 'STABLE', confidence: 0.95, method: 'rule' };
    }
    return null;
}

describe('Rule-based Classifier', () => {
    it('classifies FAULT when fault code is set', () => {
        const features = { door_state: 0, temp_volatility: 0.1, temp_delta: 0, temp_rate: 0 };
        const sample = { fault: 'COMPRESSOR_OVERLOAD', defrost_on: false, door_open: false };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'FAULT');
        assert.strictEqual(result.confidence, 1.0);
    });

    it('classifies DEFROST when defrost flag is on', () => {
        const features = { door_state: 0, temp_volatility: 0.5, temp_delta: 3, temp_rate: 0.1 };
        const sample = { fault: 'NORMAL', defrost_on: true, door_open: false };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'DEFROST');
        assert.strictEqual(result.confidence, 1.0);
    });

    it('classifies DOOR_OPEN when door is open', () => {
        const features = { door_state: 1.0, temp_volatility: 1.0, temp_delta: 3, temp_rate: 0.1 };
        const sample = { fault: 'NORMAL', defrost_on: false, door_open: true };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'DOOR_OPEN');
        assert.strictEqual(result.confidence, 1.0);
    });

    it('classifies STABLE with low volatility and small delta', () => {
        const features = { door_state: 0, temp_volatility: 0.1, temp_delta: 0.2, temp_rate: 0.01 };
        const sample = { fault: 'NORMAL', defrost_on: false, door_open: false };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'STABLE');
        assert.strictEqual(result.confidence, 0.95);
    });

    it('returns null for ambiguous states', () => {
        const features = { door_state: 0, temp_volatility: 0.8, temp_delta: 2.0, temp_rate: 0.08 };
        const sample = { fault: 'NORMAL', defrost_on: false, door_open: false };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result, null);
    });

    it('FAULT takes priority over DEFROST', () => {
        const features = { door_state: 0, temp_volatility: 0.5, temp_delta: 3, temp_rate: 0.1 };
        const sample = { fault: 'FAN_FAILURE', defrost_on: true, door_open: false };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'FAULT');
    });

    it('DEFROST takes priority over DOOR_OPEN', () => {
        const features = { door_state: 1.0, temp_volatility: 1.0, temp_delta: 5, temp_rate: 0.2 };
        const sample = { fault: 'NORMAL', defrost_on: true, door_open: true };
        const result = ruleClassify(features, sample);
        assert.strictEqual(result.state_name, 'DEFROST');
    });
});
