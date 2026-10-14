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

const V2_ONLY_IDS = ['rbac-workspaces-v2', 'rbac-access-management'];

/**
 * Chrome's visibility method for "is this org on the V2 experience". It is true when
 * platform.rbac.workspaces is enabled OR the tenant converted itself, so gating on it rather
 * than on the flag keeps converted tenants from being offered V1 search results.
 */
const ONBOARDED_METHOD = 'isKesselOrgOnboarded';
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

function getOnboardedValue(entry: SearchEntry): boolean | undefined {
  for (const p of entry.permissions ?? []) {
    if (p?.method === ONBOARDED_METHOD && Array.isArray(p.args)) {
      return p.args[0] as boolean;
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

  const allIds = entries.map((e) => e.id).filter(Boolean) as string[];
  const seen = new Set<string>();
  for (const id of allIds) {
    if (seen.has(id)) {
      console.error(`❌ Duplicate search entry id: ${id}`);
      failed = true;
    }
    seen.add(id);
  }

  const ids = new Set(allIds);
  const byId = new Map(entries.filter((e) => e.id).map((e) => [e.id!, e]));

  for (const expectedId of EXPECTED_IAM_IDS) {
    if (!ids.has(expectedId)) {
      console.error(`❌ Missing expected search entry id: ${expectedId}`);
      failed = true;
    }
  }

  for (const v2OnlyId of V2_ONLY_IDS) {
    const gate = byId.get(v2OnlyId) ? getOnboardedValue(byId.get(v2OnlyId)!) : undefined;
    if (gate !== true) {
      console.error(`❌ V2 entry id="${v2OnlyId}" must have ${ONBOARDED_METHOD}=true (found: ${gate ?? 'missing'})`);
      failed = true;
    }
  }

  for (const [v1Id, v2Id] of V1_V2_PAIRS) {
    const v1Gate = byId.get(v1Id) ? getOnboardedValue(byId.get(v1Id)!) : undefined;
    const v2Gate = byId.get(v2Id) ? getOnboardedValue(byId.get(v2Id)!) : undefined;

    if (v1Gate !== false) {
      console.error(`❌ V1 entry id="${v1Id}" must have ${ONBOARDED_METHOD}=false (found: ${v1Gate ?? 'missing'})`);
      failed = true;
    }
    if (v2Gate !== true) {
      console.error(`❌ V2 entry id="${v2Id}" must have ${ONBOARDED_METHOD}=true (found: ${v2Gate ?? 'missing'})`);
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
