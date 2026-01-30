/**
 * Auth setup for V1 UserViewer persona
 * Runs CLI login and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../auth/v1-userviewer.json');

setup('authenticate v1 userviewer', async () => {
  console.log('[Auth] Logging in as V1 UserViewer...');
  execSync(`dotenv -e e2e/auth/.env.v1-userviewer -- npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V1 UserViewer authenticated');
});
