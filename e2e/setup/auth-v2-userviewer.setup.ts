/**
 * Auth setup for V2 UserViewer persona
 * Runs CLI login and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';

setup('authenticate v2 userviewer', async () => {
  authenticatePersona('v2-userviewer');
});
