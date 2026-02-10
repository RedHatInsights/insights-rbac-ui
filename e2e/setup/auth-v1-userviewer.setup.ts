/**
 * Auth setup for V1 UserViewer persona
 * Runs CLI login and saves state before userviewer tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';

setup('authenticate v1 userviewer', async () => {
  authenticatePersona('v1-userviewer');
});
