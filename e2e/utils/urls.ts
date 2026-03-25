/**
 * URL helpers for E2E tests.
 *
 * Re-exports the app's pathname configs and provides iamUrl() to prepend
 * the /iam basename to any path returned by a PathnameConfig link() call.
 *
 * Single source of truth — never hardcode '/iam/...' strings in tests.
 *
 * @example
 * import { iamUrl, v2 } from '../../utils';
 * const ROLES_URL = iamUrl(v2.accessManagementRoles.link());
 *
 * // Parameterized:
 * await page.goto(iamUrl(v2.usersAndUserGroupsEditGroup.link(groupId)));
 */

import * as v1 from '../../src/v1/utilities/pathnames';
import * as v2Base from '../../src/v2/utilities/pathnames';
import { v2WorkspacePathnames } from '../../src/v2/features/workspaces/workspacePathnames';

const IAM_PREFIX = '/iam';

/** Prepend the /iam app basename to a path returned by link(). */
export function iamUrl(path: string): string {
  return `${IAM_PREFIX}${path}`;
}

const v2 = { ...v2Base, ...v2WorkspacePathnames };
export { v1, v2 };
