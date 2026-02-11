/**
 * Auth setup for V2 Admin persona
 * Runs CLI login and saves state before admin tests
 */
import { test as setup } from '@playwright/test';
import { authenticatePersona } from '../utils/auth';

setup('authenticate v2 admin', async () => {
  authenticatePersona('v2-admin');
});
