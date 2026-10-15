/**
 * Auth setup for V1 OrgAdmin persona
 * Runs CLI login, sets preview mode OFF, and saves state before orgadmin tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v1 orgadmin', async () => {
  const authFile = authenticatePersona('v1-orgadmin');
  await setPreviewModeInSetup(authFile, 'v1');
});
