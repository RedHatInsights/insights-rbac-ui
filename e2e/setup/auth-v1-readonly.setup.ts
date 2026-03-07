/**
 * Auth setup for V1 ReadOnly persona
 * Runs CLI login, sets preview mode OFF, and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v1 readonly', async () => {
  const authFile = authenticatePersona('v1-readonly');
  await setPreviewModeInSetup(authFile, 'v1');
});
