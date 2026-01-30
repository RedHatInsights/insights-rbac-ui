/**
 * Auth setup for V2 ReadOnly persona
 * Runs CLI login and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v2-readonly.json');

setup('authenticate v2 readonly', async () => {
  console.log('[Auth] Logging in as V2 ReadOnly...');
  execSync(`dotenv -e e2e/auth/.env.v2-readonly -- npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V2 ReadOnly authenticated');
});
