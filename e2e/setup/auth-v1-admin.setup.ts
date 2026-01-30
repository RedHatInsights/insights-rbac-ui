/**
 * Auth setup for V1 Admin persona
 * Runs CLI login and saves state before admin tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v1-admin.json');

setup('authenticate v1 admin', async () => {
  console.log('[Auth] Logging in as V1 Admin...');
  execSync(`bash scripts/run-with-env.sh e2e/auth/.env.v1-admin npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V1 Admin authenticated');
});
