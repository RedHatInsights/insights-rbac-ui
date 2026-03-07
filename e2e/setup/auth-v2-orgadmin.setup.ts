/**
 * Auth setup for V2 OrgAdmin persona
 * Runs CLI login, sets preview mode ON, and saves state before orgadmin tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v2 orgadmin', async () => {
  const authFile = authenticatePersona('v2-orgadmin');
  await setPreviewModeInSetup(authFile, 'v2');
});
