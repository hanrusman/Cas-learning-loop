/**
 * LoopLab Test Runner
 * Simple test framework - no dependencies needed
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let currentSuite = '';

function describe(name, fn) {
    currentSuite = name;
    console.log(`\n  ${name}`);
    fn();
}

function it(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`    ✓ ${name}`);
    } catch (err) {
        failedTests++;
        console.log(`    ✗ ${name}`);
        console.log(`      Error: ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertThrows(fn, message) {
    try {
        fn();
        throw new Error(message || 'Expected function to throw');
    } catch (e) {
        if (e.message === (message || 'Expected function to throw')) throw e;
    }
}

function summary() {
    console.log('\n  ─────────────────────────────');
    console.log(`  Total:  ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log('  ─────────────────────────────\n');

    if (failedTests > 0) {
        console.log('  TESTS FAILED!\n');
        process.exit(1);
    } else {
        console.log('  ALL TESTS PASSED!\n');
        process.exit(0);
    }
}

module.exports = { describe, it, assert, assertEqual, assertDeepEqual, assertThrows, summary };
