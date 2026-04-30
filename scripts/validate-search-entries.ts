import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';

const REQUIRED_FIELDS = ['id', 'title', 'description', 'href'] as const;

const EXPECTED_IAM_IDS = [
  'rbac-org-admin',
  'rbac-org-admin-v2',
  'rbac-roles',
  'rbac-roles-v2',
  'rbac-users',
  'rbac-users-v2',
  'rbac-groups',
  'rbac-groups-v2',
  'rbac-my-access',
  'rbac-my-access-v2',
  'rbac-workspaces-v2',
  'rbac-access-management',
];

const V1_V2_PAIRS: [string, string][] = [
  ['rbac-org-admin', 'rbac-org-admin-v2'],
  ['rbac-roles', 'rbac-roles-v2'],
  ['rbac-users', 'rbac-users-v2'],
  ['rbac-groups', 'rbac-groups-v2'],
  ['rbac-my-access', 'rbac-my-access-v2'],
];

const WORKSPACES_FLAG = 'platform.rbac.workspaces';
const IAM_ALT_TITLE_TERMS = ['IAM', 'RBAC', 'user access', 'roles', 'workspaces'];

interface PermissionItem {
  method?: string;
  args?: unknown[];
}

interface SearchEntry {
  id?: string;
  title?: string;
  description?: string;
  href?: string;
  alt_title?: string[];
  permissions?: PermissionItem[];
}

function getFeatureFlagValue(entry: SearchEntry, flagName: string): boolean | undefined {
  for (const p of entry.permissions ?? []) {
    if (p?.method === 'featureFlag' && Array.isArray(p.args) && p.args[0] === flagName) {
      return p.args[1] as boolean;
    }
  }
  return undefined;
}

function main(): void {
  const path = resolve(__dirname, '../deploy/frontend.yaml');
  const content = readFileSync(path, 'utf8');
  const doc = parse(content);
  const entries: SearchEntry[] = doc?.objects?.[0]?.spec?.searchEntries ?? [];
  let failed = false;

  if (entries.length === 0) {
    console.error('❌ No searchEntries found in deploy/frontend.yaml');
    process.exit(1);
  }

  for (const entry of entries) {
    for (const field of REQUIRED_FIELDS) {
      if (entry[field] === undefined || entry[field] === '') {
        console.error(`❌ Entry id="${entry.id ?? '(missing)'}" missing required field: ${field}`);
        failed = true;
      }
    }
    if (entry.href && !entry.href.startsWith('/iam/')) {
      console.error(`❌ Entry id="${entry.id}" href must start with /iam/: ${entry.href}`);
      failed = true;
    }
  }

  const ids = new Set(entries.map((e) => e.id).filter(Boolean));
  const byId = new Map(entries.filter((e) => e.id).map((e) => [e.id!, e]));

  for (const expectedId of EXPECTED_IAM_IDS) {
    if (!ids.has(expectedId)) {
      console.error(`❌ Missing expected search entry id: ${expectedId}`);
      failed = true;
    }
  }

  for (const [v1Id, v2Id] of V1_V2_PAIRS) {
    const v1Flag = byId.get(v1Id) ? getFeatureFlagValue(byId.get(v1Id)!, WORKSPACES_FLAG) : undefined;
    const v2Flag = byId.get(v2Id) ? getFeatureFlagValue(byId.get(v2Id)!, WORKSPACES_FLAG) : undefined;

    if (v1Flag !== false) {
      console.error(`❌ V1 entry id="${v1Id}" must have ${WORKSPACES_FLAG}=false (found: ${v1Flag ?? 'missing'})`);
      failed = true;
    }
    if (v2Flag !== true) {
      console.error(`❌ V2 entry id="${v2Id}" must have ${WORKSPACES_FLAG}=true (found: ${v2Flag ?? 'missing'})`);
      failed = true;
    }
  }

  const allAltTitles = entries.flatMap((e) => e.alt_title ?? []).map((t) => t.toLowerCase());
  const hasIamCoverage = IAM_ALT_TITLE_TERMS.some((term) => allAltTitles.some((t) => t.includes(term.toLowerCase())));
  if (!hasIamCoverage) {
    console.error(`❌ searchEntries must include IAM-related alt_title terms (IAM, RBAC, user access, roles, workspaces)`);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`✅ searchEntries validation passed (${entries.length} entries)`);
}

main();
