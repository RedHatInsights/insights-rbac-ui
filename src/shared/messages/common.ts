import { defineMessages } from 'react-intl';

/**
 * UI copy reused across many features (V1 and V2). Feature-specific copy stays
 * inline next to its usage; add a message here only when it is shared widely.
 */
export const commonMessages = defineMessages({
  active: {
    id: 'active',
    defaultMessage: 'Active',
    description: 'Active label',
  },
  addPermissions: {
    id: 'addPermissions',
    defaultMessage: 'Add permissions',
    description: 'Add permissions label',
  },
  application: {
    id: 'application',
    defaultMessage: 'Application',
    description: 'Application label',
  },
  cancel: {
    id: 'cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
  },
  createAtLeastOneItem: {
    id: 'createAtLeastOneItem',
    defaultMessage: 'create at least one {item}',
    description: 'Empty state description 2nd part',
  },
  createRole: {
    id: 'createRole',
    defaultMessage: 'Create role',
    description: 'Create role label',
  },
  defineCostResources: {
    id: 'defineCostResources',
    defaultMessage: 'Define Cost Management resources',
    description: 'Define Cost Management resources label',
  },
  delete: {
    id: 'delete',
    defaultMessage: 'Delete',
    description: 'Delete button text',
  },
  description: {
    id: 'description',
    defaultMessage: 'Description',
    description: 'Description column label',
  },
  discard: {
    id: 'discard',
    defaultMessage: 'Discard',
    description: 'Discard label',
  },
  edit: {
    id: 'edit',
    defaultMessage: 'Edit',
    description: 'Edit button text',
  },
  email: {
    id: 'email',
    defaultMessage: 'Email',
    description: 'Email label',
  },
  filterByKey: {
    id: 'filterByKey',
    defaultMessage: 'Filter by {key}',
    description: 'Filter by data key label',
  },
  filterMatchesNoItems: {
    id: 'filterMatchesNoItems',
    defaultMessage: 'This filter criteria matches no {items}.',
    description: 'No matching items for filter criteria message',
  },
  firstName: {
    id: 'firstName',
    defaultMessage: 'First name',
    description: 'First name label',
  },
  groups: {
    id: 'groups',
    defaultMessage: 'Groups',
    description: 'Groups plural',
  },
  inactive: {
    id: 'inactive',
    defaultMessage: 'Inactive',
    description: 'Inactive label',
  },
  lastModified: {
    id: 'lastModified',
    defaultMessage: 'Last modified',
    description: 'Last modified column label',
  },
  lastName: {
    id: 'lastName',
    defaultMessage: 'Last name',
    description: 'Last name label',
  },
  loading: {
    id: 'loading',
    defaultMessage: 'Loading...',
    description: 'Loading temporary label',
  },
  maxCharactersWarning: {
    id: 'maxCharactersWarning',
    defaultMessage: 'Can have maximum of {number} characters.',
    description: 'Maximum number of characters message',
  },
  members: {
    id: 'members',
    defaultMessage: 'Members',
    description: 'Group members label',
  },
  name: {
    id: 'name',
    defaultMessage: 'Name',
    description: 'Name column label',
  },
  no: {
    id: 'no',
    defaultMessage: 'No',
    description: 'No label',
  },
  noMatchingItemsFound: {
    id: 'noMatchingItemsFound',
    defaultMessage: 'No matching {items} found',
    description: 'No matching items found message',
  },
  noPermissions: {
    id: 'noPermissions',
    defaultMessage: 'No permissions',
    description: 'No permissions label',
  },
  noRolesFound: {
    id: 'noRolesFound',
    defaultMessage: 'No roles found',
    description: 'Empty state title when no roles match filters',
  },
  operation: {
    id: 'operation',
    defaultMessage: 'Operation',
    description: 'Operation label',
  },
  permissions: {
    id: 'permissions',
    defaultMessage: 'Permissions',
    description: 'Permissions label',
  },
  remove: {
    id: 'remove',
    defaultMessage: 'Remove',
    description: 'Remove button label',
  },
  resourceDefinitions: {
    id: 'resourceDefinitions',
    defaultMessage: 'Resource definitions',
    description: 'Resource definitions label',
  },
  resourceType: {
    id: 'resourceType',
    defaultMessage: 'Resource type',
    description: 'Resource type label',
  },
  reviewDetails: {
    id: 'reviewDetails',
    defaultMessage: 'Review details',
    description: 'Review details label',
  },
  role: {
    id: 'role',
    defaultMessage: 'Role',
    description: 'Role singular',
  },
  roleName: {
    id: 'roleName',
    defaultMessage: 'Role name',
    description: 'Role name filter placeholder',
  },
  roles: {
    id: 'roles',
    defaultMessage: 'Roles',
    description: 'Roles plural',
  },
  status: {
    id: 'status',
    defaultMessage: 'Status',
    description: 'Status label',
  },
  toConfigureUserAccess: {
    id: 'toConfigureUserAccess',
    defaultMessage: 'To configure user access to applications',
    description: 'Empty state description 1st part',
  },
  tryChangingFilters: {
    id: 'tryChangingFilters',
    defaultMessage: 'Try changing your filter settings.',
    description: 'Message advising change of the filter settings',
  },
  unauthorizedAccessBodyText: {
    id: 'unauthorizedAccessBodyText',
    defaultMessage: "You don't have permission to view this page.",
    description: 'Body text displayed on unauthorized access pages',
  },
  unauthorizedAccessServiceName: {
    id: 'unauthorizedAccessServiceName',
    defaultMessage: 'this page',
    description: 'Generic service name displayed on unauthorized access pages',
  },
  userGroups: {
    id: 'userGroups',
    defaultMessage: 'User groups',
    description: 'User groups plural',
  },
  username: {
    id: 'username',
    defaultMessage: 'Username',
    description: 'Username label',
  },
  users: {
    id: 'users',
    defaultMessage: 'Users',
    description: 'Users plural label',
  },
  yes: {
    id: 'yes',
    defaultMessage: 'Yes',
    description: 'Yes label',
  },
});
