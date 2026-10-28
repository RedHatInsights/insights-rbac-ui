/**
 * Auth setup for the V1 conversion persona.
 *
 * Org admin of a standing stage org that is eligible to convert to V2 and has not
 * opted in. Preview mode is forced OFF: the conversion banner lives on the V1 Overview
 * page, so an org pushed into the V2 experience would never see it.
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';
import { setPreviewModeInSetup } from '../utils/preview';

setup('authenticate v1 conversion', async () => {
  const authFile = authenticatePersona('v1-conversion');
  await setPreviewModeInSetup(authFile, 'v1');
});
