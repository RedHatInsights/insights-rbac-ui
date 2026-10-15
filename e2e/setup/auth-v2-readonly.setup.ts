/**
 * Auth setup for V2 ReadOnly persona
 * Runs CLI login, sets preview mode ON, and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v2 readonly', async () => {
  const authFile = authenticatePersona('v2-readonly');
  await setPreviewModeInSetup(authFile, 'v2');
});
