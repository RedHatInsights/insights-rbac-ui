/**
 * Auth setup for V1 ReadOnly persona
 * Runs CLI login and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v1-readonly.json');

setup('authenticate v1 readonly', async () => {
  console.log('[Auth] Logging in as V1 ReadOnly...');
  execSync(`bash scripts/run-with-env.sh e2e/auth/.env.v1-readonly npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V1 ReadOnly authenticated');
});
