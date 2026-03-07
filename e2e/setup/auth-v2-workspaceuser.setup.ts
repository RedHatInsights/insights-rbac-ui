/**
 * Auth setup for V2 WorkspaceUser persona
 * Runs CLI login, sets preview mode ON, and saves state before workspaceuser tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v2 workspaceuser', async () => {
  const authFile = authenticatePersona('v2-workspaceuser');
  await setPreviewModeInSetup(authFile, 'v2');
});
