/**
 * Shared authentication utility for E2E tests.
 *
 * Provides a single function to authenticate any persona,
 * reducing duplication across auth setup files.
 */
import { execSync } from 'child_process';
import path from 'path';

export type Persona = 'v1-admin' | 'v1-readonly' | 'v1-userviewer' | 'v2-admin' | 'v2-readonly' | 'v2-userviewer';

/**
 * Authenticate a persona using the CLI login command.
 *
 * @param persona - The persona to authenticate (e.g., 'v1-admin')
 * @returns The path to the saved auth state file
 */
export function authenticatePersona(persona: Persona): string {
  const authFile = path.join(__dirname, `../auth/${persona}.json`);
  const envFile = `e2e/auth/.env.${persona}`;

  console.log(`[Auth] Logging in as ${persona}...`);
  execSync(`node scripts/run-with-env.js ${envFile} npm run cli -- login --headless --save-state ${authFile}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log(`[Auth] ${persona} authenticated`);

  return authFile;
}
