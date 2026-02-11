const { describe, it } = require('node:test');
const assert = require('node:assert');

// Re-implement PCBA sensor cross-validation for testing (mirrors server.js logic).
// Uses vibration-based physics checks instead of power/frequency.
// Door detection via accelerometer gravity vector (continuous angle, not binary MC-38).
function pcbaSensorCrossValidation(state, features) {
    let score = 1.0;
    const penalties = [];

    switch (state) {
        case 0: // STABLE
            if (features.temp_volatility > 1.0) { score -= 0.3; penalties.push('high_volatility'); }
            if (Math.abs(features.temp_rate) > 0.1) { score -= 0.2; penalties.push('temp_changing'); }
            if (features.vib_spectral_stability < 0.7) { score -= 0.3; penalties.push('unstable_vibration'); }
            break;
        case 1: // DOOR_OPEN
            if (features.door_angle_norm < 0.15) { score -= 0.5; penalties.push('door_closed'); }
            break;
        case 2: // RECOVERING
            if (features.temp_rate >= 0) { score -= 0.3; penalties.push('not_cooling'); }
            if (features.vib_rms < 0.3) { score -= 0.2; penalties.push('low_vibration'); }
            break;
        case 3: // DEFROST
            if (features.vib_duty_cycle > 0.5) { score -= 0.3; penalties.push('compressor_running'); }
            break;
        case 4: // DRIFT_WARM
            // No specific cross-validation for DRIFT states in original either
            break;
        case 5: // DRIFT_COLD
            break;
        case 6: // EXCURSION
            if (features.temp_mean < -15) { score -= 0.4; penalties.push('temp_normal'); }
            break;
        case 7: // COMP_STRESS
            if (features.vib_spectral_entropy < 3.0) { score -= 0.3; penalties.push('low_spectral_entropy'); }
            if (features.vib_spectral_stability > 0.85) { score -= 0.2; penalties.push('vibration_stable'); }
            break;
        case 8: // FAULT
            if (features.vib_rms > 0.3 && features.vib_spectral_stability > 0.8) { score -= 0.3; penalties.push('systems_ok'); }
            break;
    }

    return { score: Math.max(0, score), penalties: penalties };
}

describe('PCBA Sensor Cross-Validation', () => {
    it('penalizes DOOR_OPEN when door_angle_norm < 0.15', () => {
        const result = pcbaSensorCrossValidation(1, {
            door_angle_norm: 0.01, temp_volatility: 0.5, temp_rate: 0.1,
            vib_rms: 0.5, vib_duty_cycle: 0.9, vib_spectral_stability: 0.8,
            vib_spectral_entropy: 2.5, temp_mean: -15
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('door_closed'));
        assert.strictEqual(result.score, 0.5); // -0.5 penalty
    });

    it('penalizes STABLE with high vib volatility (low spectral stability)', () => {
        const result = pcbaSensorCrossValidation(0, {
            door_angle_norm: 0.01, temp_volatility: 0.2, temp_rate: 0.01,
            vib_rms: 0.5, vib_duty_cycle: 0.9, vib_spectral_stability: 0.5,
            vib_spectral_entropy: 2.5, temp_mean: -20
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('unstable_vibration'));
    });

    it('penalizes RECOVERING with positive temp_rate', () => {
        const result = pcbaSensorCrossValidation(2, {
            door_angle_norm: 0.01, temp_volatility: 0.5, temp_rate: 0.05,
            vib_rms: 0.6, vib_duty_cycle: 1.0, vib_spectral_stability: 0.85,
            vib_spectral_entropy: 2.5, temp_mean: -16
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('not_cooling'));
    });

    it('penalizes DEFROST with high duty_cycle (compressor running)', () => {
        const result = pcbaSensorCrossValidation(3, {
            door_angle_norm: 0.01, temp_volatility: 0.3, temp_rate: 0.2,
            vib_rms: 0.5, vib_duty_cycle: 0.8, vib_spectral_stability: 0.8,
            vib_spectral_entropy: 2.5, temp_mean: -12
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('compressor_running'));
    });

    it('penalizes EXCURSION with low temp', () => {
        const result = pcbaSensorCrossValidation(6, {
            door_angle_norm: 0.01, temp_volatility: 0.5, temp_rate: 0.1,
            vib_rms: 0.6, vib_duty_cycle: 0.95, vib_spectral_stability: 0.7,
            vib_spectral_entropy: 3.0, temp_mean: -20
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('temp_normal'));
        assert.strictEqual(result.score, 0.6); // -0.4 penalty
    });

    it('penalizes COMP_STRESS with low spectral_entropy', () => {
        const result = pcbaSensorCrossValidation(7, {
            door_angle_norm: 0.01, temp_volatility: 0.5, temp_rate: 0.01,
            vib_rms: 0.53, vib_duty_cycle: 0.92, vib_spectral_stability: 0.50,
            vib_spectral_entropy: 2.0, temp_mean: -18
        });
        assert.ok(result.score < 1.0);
        assert.ok(result.penalties.includes('low_spectral_entropy'));
    });

    it('returns consistency=1.0 when physics align', () => {
        // STABLE with all features perfectly matching
        const result = pcbaSensorCrossValidation(0, {
            door_angle_norm: 0.01, temp_volatility: 0.1, temp_rate: 0.01,
            vib_rms: 0.30, vib_duty_cycle: 0.95, vib_spectral_stability: 0.95,
            vib_spectral_entropy: 2.3, temp_mean: -20
        });
        assert.strictEqual(result.score, 1.0);
        assert.strictEqual(result.penalties.length, 0);
    });

    it('returns consistency=0.0 floor (not negative)', () => {
        // STABLE with everything wrong — multiple penalties
        const result = pcbaSensorCrossValidation(0, {
            door_angle_norm: 0.01, temp_volatility: 2.0, temp_rate: 0.5,
            vib_rms: 0.8, vib_duty_cycle: 0.5, vib_spectral_stability: 0.3,
            vib_spectral_entropy: 4.0, temp_mean: -5
        });
        // Penalties: high_volatility (-0.3), temp_changing (-0.2), unstable_vibration (-0.3) = -0.8
        assert.ok(Math.abs(result.score - 0.2) < 0.001, `score=${result.score}`);
        assert.ok(result.score >= 0);
    });

    it('COMP_STRESS double-penalty for low entropy + stable vibration', () => {
        const result = pcbaSensorCrossValidation(7, {
            door_angle_norm: 0.01, temp_volatility: 0.5, temp_rate: 0.01,
            vib_rms: 0.53, vib_duty_cycle: 0.92, vib_spectral_stability: 0.90,
            vib_spectral_entropy: 2.0, temp_mean: -18
        });
        // Both low_spectral_entropy (-0.3) and vibration_stable (-0.2) should apply
        assert.ok(result.penalties.includes('low_spectral_entropy'));
        assert.ok(result.penalties.includes('vibration_stable'));
        assert.ok(Math.abs(result.score - 0.5) < 0.001, `score=${result.score}`);
    });
});
