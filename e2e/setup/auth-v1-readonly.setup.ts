/**
 * Auth setup for V1 ReadOnly persona
 * Runs CLI login and saves state before readonly tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';

setup('authenticate v1 readonly', async () => {
  authenticatePersona('v1-readonly');
});
