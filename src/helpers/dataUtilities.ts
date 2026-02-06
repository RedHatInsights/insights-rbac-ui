import type { RoleBindingsRoleBindingBySubject } from '../data/api/workspaces';
import type { Group } from '../data/queries/groups';
import messages from '../Messages';
import { useIntl } from 'react-intl';
import { z } from 'zod';

export const BAD_UUID = 'bad uuid';

// Type for table row data that must have a uuid field
export interface RowData {
  uuid: string;
  [key: string]: unknown;
}

// Generic type for mappedProps - accepts any object type and filters out falsy values
export const mappedProps = <T extends Record<string, unknown>>(apiProps: T): Partial<T> =>
  Object.entries(apiProps).reduce((acc, [key, value]) => {
    if (value) {
      (acc as Record<string, unknown>)[key] = value;
    }
    return acc;
  }, {} as Partial<T>);

export const calculateChecked = (
  rows: RowData[] = [],
  selected: RowData[],
  isRowSelectable: (row: RowData) => boolean = () => true,
): boolean | null => {
  const nonDefaults = rows.filter(isRowSelectable);
  return (
    (nonDefaults.length !== 0 && nonDefaults.every(({ uuid }) => selected.find((row) => row.uuid === uuid))) || (selected.length > 0 ? null : false)
  );
};

export const selectedRows =
  (newSelection: RowData[], isSelected: boolean) =>
  (selected: RowData[]): RowData[] => {
    if (!isSelected) {
      return selected.filter((row) => !newSelection.find(({ uuid }) => row.uuid === uuid));
    }
    return [...selected, ...newSelection].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
  };

export const isExternalIdp = (token: string = ''): boolean => {
  let roles: string[] = [''];
  let tokenArray = token.split('.');
  if (tokenArray.length > 1) {
    let token1 = window.atob(tokenArray[1]);
    if (token1) {
      try {
        const parsed = JSON.parse(token1) as { realm_access?: { roles?: string[] } };
        roles = parsed?.realm_access?.roles || [];
        if (roles.includes('external-idp')) {
          return true;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }
  return false;
};

// ============================================================================
// Role Bindings Schemas and Transformations
// ============================================================================

// Zod schemas for role binding subjects
const GroupSubjectSchema = z.object({
  id: z.string(),
  type: z.literal('group'),
  group: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    user_count: z.number().optional(),
  }),
});

const UserSubjectSchema = z.object({
  id: z.string(),
  type: z.literal('user'),
  user: z.object({
    username: z.string().optional(),
  }),
});

const SubjectSchema = z.union([GroupSubjectSchema, UserSubjectSchema]);

// Type-safe validation functions
export const parseGroupSubject = (subject: unknown) => GroupSubjectSchema.safeParse(subject);
export const parseUserSubject = (subject: unknown) => UserSubjectSchema.safeParse(subject);
export const parseSubject = (subject: unknown) => SubjectSchema.safeParse(subject);

// Transform role bindings API response to Group structure
export const mapRoleBindingsToGroups = (bindings: RoleBindingsRoleBindingBySubject[], intl: ReturnType<typeof useIntl>): Group[] =>
  bindings.map((binding): Group => {
    const subject = binding.subject;

    let name = intl.formatMessage(messages.unknownSubjectName);
    let description = '';
    let principalCount = 0;
    let uuid = '';

    // Parse subject with Zod for type-safe validation
    const groupResult = parseGroupSubject(subject);
    const userResult = parseUserSubject(subject);

    if (groupResult.success) {
      const groupSubject = groupResult.data;
      uuid = groupSubject.id;
      name = groupSubject.group.name || name;
      description = groupSubject.group.description || '';
      principalCount = groupSubject.group.user_count || 0;
    } else if (userResult.success) {
      const userSubject = userResult.data;
      uuid = userSubject.id;
      name = userSubject.user.username || name;
    } else {
      // Fallback for unknown subject types
      if (subject && typeof subject === 'object' && 'id' in subject) {
        uuid = String((subject as { id: unknown }).id);
      }
    }

    return {
      uuid,
      name,
      description,
      principalCount,
      roleCount: binding.roles?.length || 0,
      created: binding.last_modified || '',
      modified: binding.last_modified || '',
      platform_default: false,
      system: false,
      admin_default: false,
    };
  });
