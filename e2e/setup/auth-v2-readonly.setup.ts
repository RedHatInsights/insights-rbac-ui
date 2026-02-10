/**
 * Auth setup for V2 ReadOnly persona
 * Runs CLI login and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';

setup('authenticate v2 readonly', async () => {
  authenticatePersona('v2-readonly');
});
