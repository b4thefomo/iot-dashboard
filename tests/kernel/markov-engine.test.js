const { describe, it } = require('node:test');
const assert = require('node:assert');

const KERNEL_STATES = ['STABLE', 'DOOR_OPEN', 'RECOVERING', 'DEFROST', 'DRIFT_WARM', 'DRIFT_COLD', 'EXCURSION', 'COMP_STRESS', 'FAULT'];

function createMarkovEngine() {
    const matrices = [];
    for (let t = 0; t < 6; t++) {
        const m = [];
        for (let i = 0; i < 9; i++) {
            m.push(new Array(9).fill(0));
        }
        matrices.push(m);
    }
    return { matrices, totalTransitions: 0, stateHistory: [], lastState: null, maturity: 'Learning' };
}

function updateMarkovMaturity(engine) {
    const t = engine.totalTransitions;
    if (t >= 500) engine.maturity = 'Established';
    else if (t >= 200) engine.maturity = 'Mature';
    else if (t >= 50) engine.maturity = 'Developing';
    else engine.maturity = 'Learning';
}

function markovLearn(engine, fromState, toState, timePeriod, confidence, consistency) {
    if (confidence < 0.7 || consistency < 0.8) return false;
    engine.matrices[timePeriod][fromState][toState] += 1;
    engine.totalTransitions += 10;
    engine.stateHistory.push({
        from: fromState, to: toState,
        from_name: KERNEL_STATES[fromState], to_name: KERNEL_STATES[toState],
        timePeriod, timestamp: new Date().toISOString(),
    });
    if (engine.stateHistory.length > 100) engine.stateHistory.shift();
    updateMarkovMaturity(engine);
    return true;
}

function getTransitionProbability(engine, fromState, toState, timePeriod) {
    const row = engine.matrices[timePeriod][fromState];
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return row[toState] / total;
}

function checkMarkovAnomaly(engine, fromState, toState, timePeriod) {
    if (engine.maturity === 'Learning') return null;
    const prob = getTransitionProbability(engine, fromState, toState, timePeriod);
    const row = engine.matrices[timePeriod][fromState];
    const total = row.reduce((a, b) => a + b, 0);
    if (total < 5) return null;
    if (prob < 0.05) {
        return {
            type: 'markov_anomaly',
            from_state: KERNEL_STATES[fromState],
            to_state: KERNEL_STATES[toState],
            probability: prob,
            severity: prob < 0.01 ? 'critical' : 'warning',
        };
    }
    return null;
}

describe('Markov Context Engine', () => {
    it('initializes with zero matrices', () => {
        const engine = createMarkovEngine();
        assert.strictEqual(engine.totalTransitions, 0);
        assert.strictEqual(engine.maturity, 'Learning');
        for (let t = 0; t < 6; t++) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    assert.strictEqual(engine.matrices[t][i][j], 0);
                }
            }
        }
    });

    it('increments transitions correctly', () => {
        const engine = createMarkovEngine();
        markovLearn(engine, 0, 0, 0, 0.9, 0.9); // STABLE → STABLE
        assert.strictEqual(engine.matrices[0][0][0], 1);
        assert.strictEqual(engine.totalTransitions, 10);
    });

    it('rejects low-confidence inputs (gated learning)', () => {
        const engine = createMarkovEngine();
        const learned = markovLearn(engine, 0, 1, 0, 0.5, 0.9); // Low confidence
        assert.strictEqual(learned, false);
        assert.strictEqual(engine.matrices[0][0][1], 0);
    });

    it('rejects low-consistency inputs (gated learning)', () => {
        const engine = createMarkovEngine();
        const learned = markovLearn(engine, 0, 1, 0, 0.9, 0.5); // Low consistency
        assert.strictEqual(learned, false);
        assert.strictEqual(engine.matrices[0][0][1], 0);
    });

    it('computes transition probability correctly', () => {
        const engine = createMarkovEngine();
        // Add 8 STABLE→STABLE and 2 STABLE→DOOR_OPEN
        for (let i = 0; i < 8; i++) markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        for (let i = 0; i < 2; i++) markovLearn(engine, 0, 1, 0, 0.9, 0.9);

        const pStable = getTransitionProbability(engine, 0, 0, 0);
        const pDoor = getTransitionProbability(engine, 0, 1, 0);
        assert.ok(Math.abs(pStable - 0.8) < 0.001, `pStable=${pStable}`);
        assert.ok(Math.abs(pDoor - 0.2) < 0.001, `pDoor=${pDoor}`);
    });

    it('returns 0 probability for empty row', () => {
        const engine = createMarkovEngine();
        const p = getTransitionProbability(engine, 0, 0, 0);
        assert.strictEqual(p, 0);
    });

    it('maturity progresses with transition count', () => {
        const engine = createMarkovEngine();
        assert.strictEqual(engine.maturity, 'Learning');

        // Add 5 transitions (each counts as 10x) = 50 total
        for (let i = 0; i < 5; i++) markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        assert.strictEqual(engine.maturity, 'Developing');

        // Add 15 more = 200 total
        for (let i = 0; i < 15; i++) markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        assert.strictEqual(engine.maturity, 'Mature');

        // Add 30 more = 500 total
        for (let i = 0; i < 30; i++) markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        assert.strictEqual(engine.maturity, 'Established');
    });

    it('does not fire anomaly during Learning phase', () => {
        const engine = createMarkovEngine();
        markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        const anomaly = checkMarkovAnomaly(engine, 0, 8, 0); // STABLE → FAULT
        assert.strictEqual(anomaly, null);
    });

    it('fires anomaly for low-probability transitions', () => {
        const engine = createMarkovEngine();
        // Build strong STABLE→STABLE pattern
        for (let i = 0; i < 50; i++) markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        // Needs to be Developing or better
        assert.notStrictEqual(engine.maturity, 'Learning');

        // STABLE→FAULT should be anomalous (0 probability)
        // First add a single STABLE→FAULT to make probability > 0 but < 0.05
        markovLearn(engine, 0, 8, 0, 0.9, 0.9);
        const anomaly = checkMarkovAnomaly(engine, 0, 8, 0);
        assert.ok(anomaly !== null);
        assert.strictEqual(anomaly.type, 'markov_anomaly');
    });

    it('state history is capped at 100', () => {
        const engine = createMarkovEngine();
        for (let i = 0; i < 120; i++) {
            markovLearn(engine, 0, 0, 0, 0.9, 0.9);
        }
        assert.strictEqual(engine.stateHistory.length, 100);
    });
});
