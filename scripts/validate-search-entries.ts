/**
 * Search entries validation script
 *
 * Validates that deploy/frontend.yaml searchEntries are complete and aligned
 * with the frontend-operator spec (see frontend-operator search.md + api_reference).
 * Use this to catch regressions before deploy; it does not test the live console search.
 *
 * Run: npx tsx scripts/validate-search-entries.ts
 * Or:  npm run validate:search-entries
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';

const REQUIRED_FIELDS = ['id', 'title', 'description', 'href'] as const;
const EXPECTED_IAM_IDS = [
  'rbac-org-admin',
  'rbac-org-admin-v2',
  'rbac-roles',
  'rbac-roles-v2',
  'rbac-workspaces',
  'rbac-workspaces-v2',
  'rbac-users',
  'rbac-users-v2',
  'rbac-groups',
  'rbac-groups-v2',
  'rbac-my-access',
  'rbac-access-management',
];
const IAM_ALT_TITLE_TERMS = ['IAM', 'RBAC', 'user access', 'roles', 'workspaces'];

interface SearchEntry {
  id?: string;
  title?: string;
  description?: string;
  href?: string;
  alt_title?: string[];
  permissions?: unknown[];
}

function main(): void {
  const path = resolve(__dirname, '../deploy/frontend.yaml');
  const content = readFileSync(path, 'utf8');
  const doc = parse(content);
  const spec = doc?.objects?.[0]?.spec;
  const entries: SearchEntry[] = spec?.searchEntries ?? [];

  let failed = false;

  if (entries.length === 0) {
    console.error('❌ No searchEntries found in deploy/frontend.yaml');
    process.exit(1);
  }

  for (const entry of entries) {
    for (const field of REQUIRED_FIELDS) {
      if (entry[field] === undefined || entry[field] === '') {
        console.error(`❌ searchEntries entry id="${entry.id ?? '(missing)'}" missing required field: ${field}`);
        failed = true;
      }
    }
    if (entry.href && !entry.href.startsWith('/iam/')) {
      console.error(`❌ searchEntries entry id="${entry.id}" href should start with /iam/: ${entry.href}`);
      failed = true;
    }
  }

  const ids = new Set(entries.map((e) => e.id).filter(Boolean));
  for (const expectedId of EXPECTED_IAM_IDS) {
    if (!ids.has(expectedId)) {
      console.error(`❌ Missing expected search entry id: ${expectedId}`);
      failed = true;
    }
  }

  const allAltTitles = entries.flatMap((e) => e.alt_title ?? []).map((t) => t.toLowerCase());
  const hasIamCoverage = IAM_ALT_TITLE_TERMS.some((term) =>
    allAltTitles.some((t) => t.includes(term.toLowerCase()))
  );
  if (!hasIamCoverage) {
    console.error(
      `❌ searchEntries should include IAM-related alt_title (e.g. IAM, RBAC, user access, roles, workspaces) for console search discoverability.`
    );
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`✅ searchEntries validation passed (${entries.length} entries, required fields and IAM coverage OK).`);
  console.log('   To verify the fix in the UI: deploy to stage/ephemeral and test the console global search (see e2e/README.md).');
}

main();
