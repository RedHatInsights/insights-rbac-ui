#!/usr/bin/env node
/**
 * Cross-platform credential resolver for E2E tests.
 *
 * Usage: node scripts/run-with-env.js <env-file> <command...>
 *
 * Local: loads credentials from .env file using dotenv
 * CI: maps Konflux E2E_* environment variables to RBAC_* variables
 */

const { spawn } = require('child_process');
const fs = require('fs');

const envFile = process.argv[2];
const command = process.argv.slice(3);

// Validate arguments
if (!envFile) {
  console.error('Error: Missing env file argument');
  console.error('Usage: node scripts/run-with-env.js <env-file> <command...>');
  process.exit(1);
}

if (command.length === 0) {
  console.error('Error: Missing command argument');
  console.error('Usage: node scripts/run-with-env.js <env-file> <command...>');
  process.exit(1);
}

// Start with current environment
const env = { ...process.env };

if (fs.existsSync(envFile)) {
  // Local: load from dotenv file
  const dotenv = require('dotenv');
  const result = dotenv.config({ path: envFile });
  if (result.parsed) {
    Object.assign(env, result.parsed);
  }
} else {
  // CI: map Konflux E2E_* vars to RBAC_* vars based on filename pattern
  const mappings = {
    'v1-admin': ['E2E_V1_ADMIN_USERNAME', 'E2E_V1_ADMIN_PASSWORD'],
    'v1-readonly': ['E2E_V1_READONLY_USERNAME', 'E2E_V1_READONLY_PASSWORD'],
    'v1-userviewer': ['E2E_V1_USERVIEWER_USERNAME', 'E2E_V1_USERVIEWER_PASSWORD'],
    'v2-admin': ['E2E_V2_ADMIN_USERNAME', 'E2E_V2_ADMIN_PASSWORD'],
    'v2-readonly': ['E2E_V2_READONLY_USERNAME', 'E2E_V2_READONLY_PASSWORD'],
    'v2-userviewer': ['E2E_V2_USERVIEWER_USERNAME', 'E2E_V2_USERVIEWER_PASSWORD'],
  };

  const match = Object.keys(mappings).find((key) => envFile.includes(key));

  if (!match) {
    console.error(`Error: Unknown env pattern '${envFile}'`);
    console.error('Expected patterns:', Object.keys(mappings).join(', '));
    process.exit(1);
  }

  const [userVar, passVar] = mappings[match];
  env.RBAC_USERNAME = process.env[userVar];
  env.RBAC_PASSWORD = process.env[passVar];

  // Validate credentials are set
  if (!env.RBAC_USERNAME || !env.RBAC_PASSWORD) {
    console.error(`Error: Credentials not set for pattern '${match}'`);
    console.error(`Expected ${userVar} and ${passVar} to be set in environment`);
    process.exit(1);
  }
}

// Spawn the command with modified environment
const child = spawn(command[0], command.slice(1), {
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
