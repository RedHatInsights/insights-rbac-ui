import type { RoleBindingsRoleBindingBySubject } from '../data/api/workspaces';
import type { Group } from '../data/queries/groups';
import messages from '../Messages';
import { useIntl } from 'react-intl';

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
// Role Bindings Type Guards and Transformations
// ============================================================================

// Type guards for role binding subjects
export const isGroupSubject = (
  subject: unknown,
): subject is { id: string; type: 'group'; group: { name?: string; description?: string; user_count?: number } } => {
  return typeof subject === 'object' && subject !== null && 'type' in subject && (subject as { type: string }).type === 'group' && 'group' in subject;
};

export const isUserSubject = (subject: unknown): subject is { id: string; type: 'user'; user: { username?: string } } => {
  return typeof subject === 'object' && subject !== null && 'type' in subject && (subject as { type: string }).type === 'user' && 'user' in subject;
};

// Transform role bindings API response to Group structure
export const mapRoleBindingsToGroups = (bindings: RoleBindingsRoleBindingBySubject[], intl: ReturnType<typeof useIntl>): Group[] =>
  bindings.map((binding): Group => {
    const subject = binding.subject;

    let name = intl.formatMessage(messages.unknownSubjectName);
    let description = '';
    let principalCount = 0;

    if (isGroupSubject(subject)) {
      name = subject.group.name || name;
      description = subject.group.description || '';
      principalCount = subject.group.user_count || 0;
    } else if (isUserSubject(subject)) {
      name = subject.user.username || name;
    }

    return {
      uuid: subject?.id || '',
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
