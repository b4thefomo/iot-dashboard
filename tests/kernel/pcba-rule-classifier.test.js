const { describe, it } = require('node:test');
const assert = require('node:assert');

// Re-implement PCBA rule classifier for testing (mirrors server.js logic).
// PCBA rules differ from original: no fault bus, defrost inferred from vibration.
// Door detection via accelerometer gravity vector (continuous angle, not binary MC-38).
function pcbaRuleClassify(features) {
    // 1. DOOR_OPEN: accelerometer gravity vector angle > threshold
    if (features.door_angle_norm > 0.15) {
        return { state: 1, state_name: 'DOOR_OPEN', confidence: 0.95, method: 'rule' };
    }
    // 2. DEFROST: inferred from low duty cycle + temp rising
    //    No defrost_on flag on PCBA — must infer from vibration
    //    No volatility check — defrost has controlled but significant temp rise
    if (features.vib_duty_cycle < 0.2 && features.temp_rate > 0.05) {
        return { state: 3, state_name: 'DEFROST', confidence: 0.90, method: 'rule' };
    }
    // 3. STABLE: low volatility + small delta + small rate + steady vibration
    if (features.temp_volatility < 0.4 && Math.abs(features.temp_delta) < 1.0 &&
        Math.abs(features.temp_rate) < 0.05 && features.vib_spectral_stability > 0.85) {
        return { state: 0, state_name: 'STABLE', confidence: 0.95, method: 'rule' };
    }
    // 4. RECOVERING: negative temp_rate + high vib_rms (compressor working hard)
    if (features.temp_rate < -0.05 && features.vib_rms > 0.5) {
        return { state: 2, state_name: 'RECOVERING', confidence: 0.90, method: 'rule' };
    }
    // NO FAULT rule — PCBA has no fault bus, FAULT detected by ML only
    return null;
}

describe('PCBA Rule-based Classifier', () => {
    it('classifies DOOR_OPEN when door_angle_norm > 0.15', () => {
        const features = {
            door_angle_norm: 0.5, temp_volatility: 1.0, temp_delta: 3, temp_rate: 0.1,
            vib_rms: 0.5, vib_duty_cycle: 0.9, vib_spectral_stability: 0.8
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'DOOR_OPEN');
        assert.strictEqual(result.confidence, 0.95);
        assert.strictEqual(result.method, 'rule');
    });

    it('classifies STABLE with low volatility + steady vibration', () => {
        const features = {
            door_angle_norm: 0.01, temp_volatility: 0.1, temp_delta: 0.2, temp_rate: 0.01,
            vib_rms: 0.30, vib_duty_cycle: 0.95, vib_spectral_stability: 0.95
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'STABLE');
        assert.strictEqual(result.confidence, 0.95);
    });

    it('classifies DEFROST when duty_cycle < 0.2 + temp rising', () => {
        const features = {
            door_angle_norm: 0.01, temp_volatility: 2.0, temp_delta: 5.0, temp_rate: 0.2,
            vib_rms: 0.03, vib_duty_cycle: 0.15, vib_spectral_stability: 0.3
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'DEFROST');
        assert.strictEqual(result.confidence, 0.90);
    });

    it('does NOT classify FAULT (no fault bus on PCBA)', () => {
        // Even with features suggesting a fault, the rule classifier should not detect it
        const features = {
            door_angle_norm: 0.01, temp_volatility: 3.0, temp_delta: 5.0, temp_rate: 0.2,
            vib_rms: 0.15, vib_duty_cycle: 0.3, vib_spectral_stability: 0.25
        };
        const result = pcbaRuleClassify(features);
        // Should fall through to null since no rule matches FAULT
        assert.strictEqual(result, null);
    });

    it('classifies RECOVERING with negative temp_rate + high vib_rms', () => {
        const features = {
            door_angle_norm: 0.01, temp_volatility: 0.8, temp_delta: -2.5, temp_rate: -0.12,
            vib_rms: 0.60, vib_duty_cycle: 1.0, vib_spectral_stability: 0.85
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'RECOVERING');
        assert.strictEqual(result.confidence, 0.90);
    });

    it('returns null for ambiguous features', () => {
        const features = {
            door_angle_norm: 0.01, temp_volatility: 0.8, temp_delta: 2.0, temp_rate: 0.08,
            vib_rms: 0.45, vib_duty_cycle: 0.9, vib_spectral_stability: 0.80
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result, null);
    });

    it('confidence is 0.90 for inferred DEFROST', () => {
        const features = {
            door_angle_norm: 0.01, temp_volatility: 2.0, temp_delta: 4.0, temp_rate: 0.15,
            vib_rms: 0.04, vib_duty_cycle: 0.08, vib_spectral_stability: 0.25
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'DEFROST');
        assert.strictEqual(result.confidence, 0.90); // Lower than flag-based 1.0
    });

    it('confidence is 0.95 for DOOR_OPEN (inferred from accelerometer)', () => {
        const features = {
            door_angle_norm: 0.5, temp_volatility: 0.1, temp_delta: 0.1, temp_rate: 0.01,
            vib_rms: 0.30, vib_duty_cycle: 0.95, vib_spectral_stability: 0.95
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'DOOR_OPEN');
        assert.strictEqual(result.confidence, 0.95); // Inferred from accelerometer, not binary sensor
    });

    it('DOOR_OPEN takes priority over DEFROST', () => {
        // Even if defrost conditions are met, door open wins
        const features = {
            door_angle_norm: 0.5, temp_volatility: 0.3, temp_delta: 5.0, temp_rate: 0.2,
            vib_rms: 0.03, vib_duty_cycle: 0.05, vib_spectral_stability: 0.3
        };
        const result = pcbaRuleClassify(features);
        assert.strictEqual(result.state_name, 'DOOR_OPEN');
    });

    it('STABLE requires vib_spectral_stability > 0.85', () => {
        // All thermal features match STABLE, but low spectral stability
        const features = {
            door_angle_norm: 0.01, temp_volatility: 0.1, temp_delta: 0.2, temp_rate: 0.01,
            vib_rms: 0.30, vib_duty_cycle: 0.95, vib_spectral_stability: 0.70
        };
        const result = pcbaRuleClassify(features);
        // Should NOT classify as STABLE due to low spectral stability
        assert.notStrictEqual(result && result.state_name, 'STABLE');
    });
});
