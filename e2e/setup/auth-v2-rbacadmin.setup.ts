/**
 * Auth setup for V2 RbacAdmin persona
 * Runs CLI login, sets preview mode ON, and saves state before rbacadmin tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v2 rbacadmin', async () => {
  const authFile = authenticatePersona('v2-rbacadmin');
  await setPreviewModeInSetup(authFile, 'v2');
});
