#!/bin/bash
set -e

# Run All Test Suites
# This script runs unit tests, CLI tests, and E2E tests in sequence
#
# Usage:
#   ./run-all-tests.sh
#
# Environment Variables:
#   TEST_PREFIX_V1 - Prefix for V1 test data (required for E2E, min 4 chars)
#   TEST_PREFIX_V2 - Prefix for V2 test data (required for E2E, min 4 chars)
#
# Example:
#   TEST_PREFIX_V1=myname-v1 TEST_PREFIX_V2=myname-v2 ./run-all-tests.sh

echo "========================================="
echo "Running All Test Suites"
echo "========================================="
echo ""

# Check E2E prerequisites
if [ -z "$TEST_PREFIX_V1" ] || [ -z "$TEST_PREFIX_V2" ]; then
  echo "⚠️  Warning: TEST_PREFIX_V1 and TEST_PREFIX_V2 not set"
  echo "   E2E tests will be skipped"
  echo "   Set both to run E2E: TEST_PREFIX_V1=myname-v1 TEST_PREFIX_V2=myname-v2"
  echo ""
  SKIP_E2E=true
else
  SKIP_E2E=false
fi

# 1. Unit Tests (Web)
echo "========================================="
echo "1/4 Running Unit Tests (Web)"
echo "========================================="
npm run test:web
echo "✓ Unit tests passed"
echo ""

# 2. CLI Tests
echo "========================================="
echo "2/4 Running CLI Tests"
echo "========================================="
npm run test:cli
echo "✓ CLI tests passed"
echo ""

if [ "$SKIP_E2E" = true ]; then
  echo "========================================="
  echo "Skipping E2E Tests"
  echo "========================================="
  echo "Set TEST_PREFIX_V1 and TEST_PREFIX_V2 to run E2E tests"
  echo ""
  echo "========================================="
  echo "Summary: Unit + CLI tests passed ✓"
  echo "========================================="
  exit 0
fi

# 3. E2E V1 Tests
echo "========================================="
echo "3/4 Running E2E V1 Tests"
echo "========================================="
npm run e2e:v1
echo "✓ E2E V1 tests passed"
echo ""

# 4. E2E V2 Tests
echo "========================================="
echo "4/4 Running E2E V2 Tests"
echo "========================================="
npm run e2e:v2
echo "✓ E2E V2 tests passed"
echo ""

echo "========================================="
echo "All Tests Passed! ✓"
echo "========================================="
