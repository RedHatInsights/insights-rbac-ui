/**
 * Auth setup for V2 UserViewer persona
 * Runs CLI login, sets preview mode ON, and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v2 userviewer', async () => {
  const authFile = authenticatePersona('v2-userviewer');
  await setPreviewModeInSetup(authFile, 'v2');
});
