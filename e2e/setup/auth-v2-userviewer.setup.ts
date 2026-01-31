/**
 * Auth setup for V2 UserViewer persona
 * Runs CLI login and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v2-userviewer.json');

setup('authenticate v2 userviewer', async () => {
  console.log('[Auth] Logging in as V2 UserViewer...');
  execSync(`bash scripts/run-with-env.sh e2e/auth/.env.v2-userviewer npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V2 UserViewer authenticated');
});
