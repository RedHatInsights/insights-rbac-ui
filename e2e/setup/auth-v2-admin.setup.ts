/**
 * Auth setup for V2 Admin persona
 * Runs CLI login and saves state before admin tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v2-admin.json');

setup('authenticate v2 admin', async () => {
  console.log('[Auth] Logging in as V2 Admin...');
  execSync(`bash scripts/run-with-env.sh e2e/auth/.env.v2-admin npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V2 Admin authenticated');
});
