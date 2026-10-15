#!/usr/bin/env node
/**
 * Check E2E test results against expected failures baseline.
 *
 * This script allows CI to pass when only known/expected tests fail.
 * It will fail if:
 * - A new test fails (not in expected-failures.json)
 * - An expected failure suddenly passes (needs to be removed from baseline)
 *
 * Usage:
 *   npx playwright test || true  # Run tests, don't fail yet
 *   node scripts/check-test-baseline.js  # This decides pass/fail
 */

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(__dirname, '../e2e/test-results/results.json');
const BASELINE_PATH = path.join(__dirname, '../e2e/expected-failures.json');

function main() {
  // Load test results
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error('❌ Test results not found at:', RESULTS_PATH);
    console.error('   Run playwright tests first: npx playwright test');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));

  // Load expected failures baseline
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error('❌ Expected failures baseline not found at:', BASELINE_PATH);
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));

  // Build a set of expected failure keys (file + title)
  const expectedFailures = new Set(
    baseline.failures.map((f) => `${f.file}::${f.title}`)
  );

  // Extract actual failures from results
  const actualFailures = new Set();
  const allTests = [];

  function extractTests(suites) {
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          const key = `${spec.file}::${spec.title}`;
          allTests.push({ key, ok: spec.ok, title: spec.title, file: spec.file });
          if (!spec.ok) {
            actualFailures.add(key);
          }
        }
      }
      if (suite.suites) {
        extractTests(suite.suites);
      }
    }
  }

  extractTests(results.suites || []);

  // Find unexpected failures (failed but not in baseline)
  const unexpectedFailures = [];
  for (const key of actualFailures) {
    if (!expectedFailures.has(key)) {
      unexpectedFailures.push(key);
    }
  }

  // Find fixed tests (in baseline but now passing)
  const fixedTests = [];
  for (const key of expectedFailures) {
    if (!actualFailures.has(key)) {
      // Check if the test exists and passed
      const test = allTests.find((t) => t.key === key);
      if (test && test.ok) {
        fixedTests.push(key);
      }
    }
  }

  // Report results
  const totalTests = allTests.length;
  const passedTests = allTests.filter((t) => t.ok).length;
  const failedTests = actualFailures.size;
  const expectedCount = expectedFailures.size;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    E2E TEST BASELINE CHECK');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📊 Results: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
  console.log(`📋 Baseline: ${expectedCount} expected failures\n`);

  let exitCode = 0;

  // Report unexpected failures
  if (unexpectedFailures.length > 0) {
    console.log('❌ UNEXPECTED FAILURES (new failures not in baseline):');
    for (const key of unexpectedFailures) {
      const [file, title] = key.split('::');
      console.log(`   • ${title}`);
      console.log(`     File: ${file}`);
    }
    console.log('\n   → Add these to e2e/expected-failures.json or fix the tests.\n');
    exitCode = 1;
  }

  // Report fixed tests
  if (fixedTests.length > 0) {
    console.log('🎉 FIXED TESTS (expected failures that now pass):');
    for (const key of fixedTests) {
      const [file, title] = key.split('::');
      console.log(`   • ${title}`);
      console.log(`     File: ${file}`);
    }
    console.log('\n   → Remove these from e2e/expected-failures.json.\n');
    exitCode = 1;
  }

  // Summary
  if (exitCode === 0) {
    console.log('✅ All failures are expected. Baseline check PASSED.\n');
  } else {
    console.log('❌ Baseline check FAILED. See above for details.\n');
  }

  process.exit(exitCode);
}

main();
