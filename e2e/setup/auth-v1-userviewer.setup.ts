/**
 * Auth setup for V1 UserViewer persona
 * Runs CLI login, sets preview mode OFF, and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v1 userviewer', async () => {
  const authFile = authenticatePersona('v1-userviewer');
  await setPreviewModeInSetup(authFile, 'v1');
});
