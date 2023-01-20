import { defineMessages } from 'react-intl';

export default defineMessages({
  notApplicable: {
    id: 'notApplicable',
    description: 'Not applicable text for resource definitions',
    defaultMessage: 'N/A',
  },
  orgAdministrator: {
    id: 'orgAdministrator',
    description: 'Org. Administrator name',
    defaultMessage: 'Org. Administrator',
  },
  userAccessAdmin: {
    id: 'userAccessAdmin',
    description: 'User Access Admin name',
    defaultMessage: 'User Access Admin',
  },
  orgAdminHint: {
    id: 'orgAdminHint',
    description: 'User Access Admin hint about permissions',
    defaultMessage: "You can manage other users' permissions with 'User access'",
  },
  userAccessAdminHint: {
    id: 'userAccessAdminHint',
    description: 'Org. Admin hint about permissions',
    defaultMessage: "You can manage other users' permissions with 'User access'",
  },
  pageNotExists: {
    id: 'pageNotExists',
    description: 'Placeholder text for non existing page',
    defaultMessage: 'Page you are looking for does not exist.',
  },
  usersDescription: {
    id: 'usersDescription',
    description: 'Description text for user list',
    defaultMessage: 'These are all of the users in your Red Hat organization.',
  },
  rbacUsers: {
    id: 'rbacUsers',
    description: 'RBAC Users error cather title',
    defaultMessage: 'RBAC Users',
  },
  rbacGroups: {
    id: 'rbacGroups',
    description: 'RBAC Groups error cather title',
    defaultMessage: 'RBAC Groups',
  },
  pleaseChoose: {
    id: 'pleaseChoose',
    description: 'Select placehoder',
    defaultMessage: 'Please choose',
  },
  yes: {
    id: 'yes',
    description: 'Yes label',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'no',
    description: 'No label',
    defaultMessage: 'No',
  },
  active: {
    id: 'active',
    description: 'Active label',
    defaultMessage: 'Active',
  },
  inactive: {
    id: 'inactive',
    description: 'Inactive label',
    defaultMessage: 'Inactive',
  },
  none: {
    id: 'none',
    description: 'None select option text',
    defaultMessage: 'None',
  },
  cancel: {
    id: 'cancel',
    description: 'Cancel button text',
    defaultMessage: 'Cancel',
  },
  close: {
    id: 'close',
    description: 'Close button text',
    defaultMessage: 'Close',
  },
  exit: {
    id: 'exit',
    description: 'Exit button text',
    defaultMessage: 'Exit',
  },
  stay: {
    id: 'stay',
    description: 'Stay button text',
    defaultMessage: 'Stay',
  },
  save: {
    id: 'save',
    description: 'Save button text',
    defaultMessage: 'Save',
  },
  edit: {
    id: 'edit',
    description: 'Edit button text',
    defaultMessage: 'Edit',
  },
  delete: {
    id: 'delete',
    description: 'Delete button text',
    defaultMessage: 'Delete',
  },
  review: {
    id: 'review',
    description: 'Review label',
    defaultMessage: 'Review',
  },
  confirm: {
    id: 'confirm',
    description: 'Confirm button text',
    defaultMessage: 'Confirm',
  },
  confirmCheckMessage: {
    id: 'confirmCheckMessage',
    description: 'Confirm modal check message',
    defaultMessage: 'I understand, and I want to continue.',
  },
  noMatchingItemsFound: {
    id: 'noMatchingItemsFound',
    description: 'No matching items found message',
    defaultMessage: 'No matching {items} found',
  },
  filterMatchesNoItems: {
    id: 'filterMatchesNoItems',
    description: 'No matching items for filter criteria message',
    defaultMessage: 'This filter criteria matches no {items}.',
  },
  tryChangingFilters: {
    id: 'tryChangingFilters',
    description: 'Message advising change of the filter settings',
    defaultMessage: 'Try changing your filter settings.',
  },
  checkFilterBeginning: {
    id: 'checkFilterBeginning',
    description: 'Message advising checking the filter value',
    defaultMessage:
      'Make sure the beginning of your search input corresponds to the beginning of the value you are looking for, or try changing your filter settings.',
  },
  clearAllFilters: {
    id: 'clearAllFilters',
    description: 'Clear all filters message',
    defaultMessage: 'Clear all filters',
  },
  filterMatchesNoFilters: {
    id: 'filterMatchesNoFilters',
    description: 'No matching items for filter criteria message',
    defaultMessage: 'This filter criteria matches no {items}.',
  },
  configureItems: {
    id: 'configureItems',
    description: 'Configure items message',
    defaultMessage: 'Configure {items}',
  },
  toConfigureUserAccess: {
    id: 'toConfigureUserAccess',
    description: 'Empty state description 1st part',
    defaultMessage: 'To configure user access to applications',
  },
  createAtLeastOneItem: {
    id: 'createAtLeastOneItem',
    description: 'Empty state description 2nd part',
    defaultMessage: 'create at least one {item}',
  },
  selectNone: {
    id: 'selectNone',
    description: 'Select none button label',
    defaultMessage: 'Select none (0)',
  },
  selectPage: {
    id: 'selectPage',
    description: 'Select page button label',
    defaultMessage: 'Select page ({length})',
  },
  selectAll: {
    id: 'selectAll',
    description: 'Select all button label',
    defaultMessage: 'Select all ({length})',
  },
  filterByKey: {
    id: 'filterByKey',
    description: 'Filter by data key label',
    defaultMessage: 'Filter by {key}',
  },
  editGroupSuccessTitle: {
    id: 'editGroupSuccessTitle',
    description: 'Edit group success notification title',
    defaultMessage: 'Success updating group',
  },
  editGroupSuccessDescription: {
    id: 'editGroupSuccessDescription',
    description: 'Edit group success notification description',
    defaultMessage: 'The group was updated successfully.',
  },
  editGroupErrorTitle: {
    id: 'editGroupErrorTitle',
    description: 'Edit group error notification title',
    defaultMessage: 'Failed updating group',
  },
  editGroupErrorDescription: {
    id: 'editGroupErrorDescription',
    description: 'Edit group error notification description',
    defaultMessage: 'The group was not updated successfuly.',
  },
  removeGroupSuccess: {
    id: 'removeGroupSuccess',
    description: 'Remove group success notification title',
    defaultMessage: 'Group deleted successfully',
  },
  removeGroupsSuccess: {
    id: 'removeGroupsSuccess',
    description: 'Remove groups success notification title',
    defaultMessage: 'Groups deleted successfully',
  },
  removeGroupError: {
    id: 'removeGroupError',
    description: 'Remove group error notification title',
    defaultMessage: 'There was an error deleting the group. Please try again.',
  },
  removeGroupsError: {
    id: 'removeGroupsError',
    description: 'Remove groups error notification title',
    defaultMessage: 'There was an error deleting the groups. Please try again.',
  },
  addGroupMembersSuccessTitle: {
    id: 'addGroupMembersSuccessTitle',
    description: 'Add group members success notification title',
    defaultMessage: 'Success adding members to group',
  },
  addGroupMembersSuccessDescription: {
    id: 'addGroupMembersSuccessDescription',
    description: 'Add group members success notification description',
    defaultMessage: 'The members were successfully added to the group.',
  },
  addGroupMembersErrorTitle: {
    id: 'addGroupMembersErrorTitle',
    description: 'Add group members error notification title',
    defaultMessage: 'Failed adding members to group',
  },
  addGroupMembersErrorDescription: {
    id: 'addGroupMembersErrorDescription',
    description: 'Add group members error notification description',
    defaultMessage: 'The members were not added successfully.',
  },
  removeGroupMembersSuccessTitle: {
    id: 'removeGroupMembersSuccessTitle',
    description: 'Remove group members success notification title',
    defaultMessage: 'Success removing members from group',
  },
  removeGroupMembersSuccessDescription: {
    id: 'removeGroupMembersSuccessDescription',
    description: 'Remove group members success notification description',
    defaultMessage: 'The members were successfully removed from the group.',
  },
  removeGroupMembersErrorTitle: {
    id: 'removeGroupMembersErrorTitle',
    description: 'Remove group members error notification title',
    defaultMessage: 'Failed removing members from the group',
  },
  removeGroupMembersErrorDescription: {
    id: 'removeGroupMembersErrorDescription',
    description: 'Remove group members error notification description',
    defaultMessage: 'The members were not removed successfully.',
  },
  addGroupRolesSuccessTitle: {
    id: 'addGrouprolesSuccessTitle',
    description: 'Add group roles success notification title',
    defaultMessage: 'Success adding roles to group',
  },
  addGroupRolesSuccessDescription: {
    id: 'addGroupRolesSuccessDescription',
    description: 'Add group roles success notification description',
    defaultMessage: 'The roles were successfully added to the group.',
  },
  addGroupRolesErrorTitle: {
    id: 'addGroupRolesErrorTitle',
    description: 'Add group roles error notification title',
    defaultMessage: 'Failed adding roles to group',
  },
  addGroupRolesErrorDescription: {
    id: 'addGroupRolesErrorDescription',
    description: 'Add group roles error notification description',
    defaultMessage: 'The roles were not added successfully.',
  },
  removeGroupRolesSuccessTitle: {
    id: 'removeGroupRolesSuccessTitle',
    description: 'Remove group roles success notification title',
    defaultMessage: 'Success removing roles from group',
  },
  removeGroupRolesSuccessDescription: {
    id: 'removeGroupRolesSuccessDescription',
    description: 'Remove group roles success notification description',
    defaultMessage: 'The roles were successfully removed from the group.',
  },
  removeGroupRolesErrorTitle: {
    id: 'removeGroupRolesErrorTitle',
    description: 'Remove group roles error notification title',
    defaultMessage: 'Failed removing roles from the group',
  },
  removeGroupRolesErrorDescription: {
    id: 'removeGroupRolesErrorDescription',
    description: 'Remove group roles error notification description',
    defaultMessage: 'The roles were not removed successfully.',
  },
  addPolicySuccessTitle: {
    id: 'addPolicySuccessTitle',
    description: 'Add policy success notification title',
    defaultMessage: 'Success adding policy',
  },
  addPolicySuccessDescription: {
    id: 'addPolicySuccessDescription',
    description: 'Add policy success notification description',
    defaultMessage: 'The policy was added successfully.',
  },
  addPolicyErrorTitle: {
    id: 'addPolicyErrorTitle',
    description: 'Add policy error notification title',
    defaultMessage: 'Failed adding policy',
  },
  addPolicyErrorDescription: {
    id: 'addPolicyErrorDescription',
    description: 'Add policy error notification description',
    defaultMessage: 'The policy was not added successfully.',
  },
  removePolicySuccessTitle: {
    id: 'removePolicySuccessTitle',
    description: 'Remove policy success notification title',
    defaultMessage: 'Success removing policy',
  },
  removePolicySuccessDescription: {
    id: 'removePolicySuccessDescription',
    description: 'Remove policy success notification description',
    defaultMessage: 'The policy was removed successfully.',
  },
  editPolicySuccessTitle: {
    id: 'editPolicySuccessTitle',
    description: 'Edit policy success notification title',
    defaultMessage: 'Success updating policy',
  },
  editPolicySuccessDescription: {
    id: 'editPolicySuccessDescription',
    description: 'Edit policy success notification description',
    defaultMessage: 'The policy was updated successfully.',
  },
  editPolicyErrorTitle: {
    id: 'editPolicyErrorTitle',
    description: 'Edit policy error notification title',
    defaultMessage: 'Failed updating policy',
  },
  editPolicyErrorDescription: {
    id: 'editPolicyErrorDescription',
    description: 'Edit policy error notification description',
    defaultMessage: 'The policy was not updated successfully.',
  },
  createRoleErrorTitle: {
    id: 'createRoleErrorTitle',
    description: 'Create role error notification title',
    defaultMessage: 'Failed adding role',
  },
  createRoleErrorDescription: {
    id: 'createRoleErrorDescription',
    description: 'Create role error notification description',
    defaultMessage: 'The role was not added successfuly.',
  },
  removeRoleSuccessTitle: {
    id: 'removeRoleSuccessTitle',
    description: 'Remove role success notification title',
    defaultMessage: 'Success removing role',
  },
  removeRoleSuccessDescription: {
    id: 'removeRoleSuccessDescription',
    description: 'Remove role success notification description',
    defaultMessage: 'The role was removed successfully.',
  },
  removeRoleErrorTitle: {
    id: 'removeRoleErrorTitle',
    description: 'Remove role error notification title',
    defaultMessage: 'Failed removing role',
  },
  removeRoleErrorDescription: {
    id: 'removeRoleErrorDescription',
    description: 'Remove role error notification description',
    defaultMessage: 'The role was not removed successfully.',
  },
  editRoleSuccessTitle: {
    id: 'editRoleSuccessTitle',
    description: 'Edit role success notification title',
    defaultMessage: 'Success updating role',
  },
  editRoleSuccessDescription: {
    id: 'editRoleSuccessDescription',
    description: 'Edit role success notification description',
    defaultMessage: 'The role was updated successfully.',
  },
  editRoleErrorTitle: {
    id: 'editRoleErrorTitle',
    description: 'Edit role error notification title',
    defaultMessage: 'Failed updating role',
  },
  editRoleErrorDescription: {
    id: 'editRoleErrorDescription',
    description: 'Edit role error notification description',
    defaultMessage: 'The role was not updated successfully.',
  },
  exitItemCreation: {
    id: 'exitItemCreation',
    description: 'Exit item creation modal title',
    defaultMessage: 'Exit {item} creation?',
  },
  discardedInputsWarning: {
    id: 'discardedInputsWarning',
    description: 'Warning saying that all inputs will be discarded',
    defaultMessage: 'All inputs will be discarded',
  },
  returnToStepNumber: {
    id: 'returnToStepNumber',
    description: 'Return to step wizard label',
    defaultMessage: 'Return to step {number}',
  },
  addingGroupTitle: {
    id: 'addingGroupTitle',
    description: 'Adding group notification title',
    defaultMessage: 'Adding group',
  },
  editingGroupTitle: {
    id: 'editingGroupTitle',
    description: 'Editing group notification title',
    defaultMessage: 'Editing group',
  },
  editingRoleTitle: {
    id: 'editingRoleTitle',
    description: 'Editing role notification title',
    defaultMessage: 'Editing role',
  },
  editingRoleCanceledDescription: {
    id: 'editingRoleCanceledDescription',
    description: 'Editing role canceled notification description',
    defaultMessage: 'Edit role was canceled by the user.',
  },
  addingGroupCanceledDescription: {
    id: 'addingGroupCanceledDescription',
    description: 'Adding group canceled notification description',
    defaultMessage: 'Adding group was canceled by the user.',
  },
  editGroupCanceledDescription: {
    id: 'editGroupCanceledDescription',
    description: 'Edit group canceled notification description',
    defaultMessage: 'Edit group was canceled by the user.',
  },
  addGroupSuccessTitle: {
    id: 'addGroupSuccessTitle',
    description: 'Add group success notification title',
    defaultMessage: 'Success adding group',
  },
  addGroupSuccessDescription: {
    id: 'addGroupSuccessDescription',
    description: 'Add group success notification description',
    defaultMessage: 'The group was added successfully.',
  },
  addingGroupMemberTitle: {
    id: 'addingGroupMemberTitle',
    description: 'Adding group member notification title',
    defaultMessage: 'Adding member to group',
  },
  addingGroupMembersTitle: {
    id: 'addingGroupMembersTitle',
    description: 'Adding group members notification title',
    defaultMessage: 'Adding members to group',
  },
  addingGroupMemberDescription: {
    id: 'addingGroupMemberDescription',
    description: 'Adding group member notification description',
    defaultMessage: 'Adding member to group initialized.',
  },
  addingGroupMembersDescription: {
    id: 'addingGroupMembersDescription',
    description: 'Adding group members notification description',
    defaultMessage: 'Adding members to group initialized.',
  },
  addingGroupMemberCancelled: {
    id: 'addingGroupMemberCancelled',
    description: 'Adding group member cancelled notification description',
    defaultMessage: 'Adding member to group was canceled by the user.',
  },
  addingGroupMembersCancelled: {
    id: 'addingGroupMembersCancelled',
    description: 'Adding group members cancelled notification description',
    defaultMessage: 'Adding member to group was canceled by the user.',
  },
  groupNameTakenTitle: {
    id: 'groupNameTakenTitle',
    description: 'Group name taken error title',
    defaultMessage: 'Group name already taken',
  },
  groupNameTakenText: {
    id: 'groupNameTakenText',
    description: 'Group name taken error text',
    defaultMessage: 'Please return to Step 1: Group information and choose a unique group name for your group.',
  },
  roleNameTakenTitle: {
    id: 'roleNameTakenTitle',
    description: 'Role name taken error title',
    defaultMessage: 'Role name already taken',
  },
  roleNameTakenText: {
    id: 'roleNameTakenText',
    description: 'Role name taken error text',
    defaultMessage: 'Please return to Step 1: Create role and choose a unique role name for your custom role.',
  },
  reviewDetails: {
    id: 'reviewDetails',
    description: 'Review details label',
    defaultMessage: 'Review details',
  },
  name: {
    id: 'name',
    description: 'Name column label',
    defaultMessage: 'Name',
  },
  description: {
    id: 'description',
    description: 'Description column label',
    defaultMessage: 'Description',
  },
  lastModified: {
    id: 'lastModified',
    description: 'Last modified column label',
    defaultMessage: 'Last modified',
  },
  roleName: {
    id: 'roleName',
    description: 'Role name filter placeholder',
    defaultMessage: 'Role name',
  },
  roleDescription: {
    id: 'roleDescription',
    description: 'Role description label',
    defaultMessage: 'Role description',
  },
  baseRole: {
    id: 'baseRole',
    description: 'Base role label',
    defaultMessage: 'Base role',
  },
  role: {
    id: 'role',
    description: 'Role singular',
    defaultMessage: 'role',
  },
  roles: {
    id: 'roles',
    description: 'Roles plural',
    defaultMessage: 'Roles',
  },
  groups: {
    id: 'groups',
    description: 'Groups plural',
    defaultMessage: 'Groups',
  },
  group: {
    id: 'group',
    description: 'Group singular',
    defaultMessage: 'Group',
  },
  groupName: {
    id: 'groupName',
    description: 'Group name label',
    defaultMessage: 'Group name',
  },
  groupDescription: {
    id: 'groupDescription',
    description: 'Group description label',
    defaultMessage: 'Group description',
  },
  required: {
    id: 'required',
    description: 'Required input label',
    defaultMessage: 'Required',
  },
  maxCharactersWarning: {
    id: 'maxCharactersWarning',
    description: 'Maximum number of characters message',
    defaultMessage: 'Can have maximum of {number} characters.',
  },
  selectRolesForGroupText: {
    id: 'selectRolesForGroupText',
    description: 'Select roles to be added to a group text',
    defaultMessage: 'Select one or more roles to add to this group.',
  },
  toManageUsersText: {
    id: 'toManageUsersText',
    description: 'To manage users text',
    defaultMessage: 'To manage users, go to your',
  },
  createGroup: {
    id: 'createGroup',
    description: 'Create group wizard title',
    defaultMessage: 'Create group',
  },
  nameAndDescription: {
    id: 'nameAndDescription',
    description: 'Name and description wizard step title',
    defaultMessage: 'Name and description',
  },
  addRole: {
    id: 'addRole',
    description: 'Add role title',
    defaultMessage: 'Add role',
  },
  addRoles: {
    id: 'addRoles',
    description: 'Add roles wizard step title',
    defaultMessage: 'Add roles',
  },
  addMembers: {
    id: 'addMembers',
    description: 'Add members wizard step title',
    defaultMessage: 'Add members',
  },
  members: {
    id: 'members',
    description: 'Group members label',
    defaultMessage: 'Members',
  },
  user: {
    id: 'user',
    description: 'User label',
    defaultMessage: 'user',
  },
  users: {
    id: 'users',
    description: 'Users plural label',
    defaultMessage: 'Users',
  },
  username: {
    id: 'username',
    description: 'Username label',
    defaultMessage: 'Username',
  },
  email: {
    id: 'email',
    description: 'Email label',
    defaultMessage: 'Email',
  },
  status: {
    id: 'status',
    description: 'Status label',
    defaultMessage: 'Status',
  },
  firstName: {
    id: 'firstName',
    description: 'First name label',
    defaultMessage: 'First name',
  },
  lastName: {
    id: 'lastName',
    description: 'Last name label',
    defaultMessage: 'Last name',
  },
  addToGroup: {
    id: 'addToGroup',
    description: 'Add to group label',
    defaultMessage: 'Add to group',
  },
  removeMemberText: {
    id: 'removeMemberText',
    description: 'Remove member text',
    defaultMessage: '<b>{name}</b> will lose all the roles associated with the <b>{group}</b> group.',
  },
  removeMembersText: {
    id: 'removeMembersText',
    description: 'Remove members plural text',
    defaultMessage: 'These <b>{name}</b> members will lose all the roles associated with the <b>{group}</b> group.',
  },
  remove: {
    id: 'remove',
    description: 'Remove button label',
    defaultMessage: 'Remove',
  },
  member: {
    id: 'member',
    description: 'Member text',
    defaultMessage: 'member',
  },
  removeMemberQuestion: {
    id: 'removeMemberQuestion',
    description: 'Remove member question',
    defaultMessage: 'Remove member?',
  },
  removeMembersQuestion: {
    id: 'removeMembersQuestion',
    description: 'Remove members question',
    defaultMessage: 'Remove members?',
  },
  removeMember: {
    id: 'removeMember',
    description: 'Remove member',
    defaultMessage: 'Remove member',
  },
  addMember: {
    id: 'addMember',
    description: 'Add member',
    defaultMessage: 'Add member',
  },
  allOrgAdminsAreMembers: {
    id: 'allOrgAdminsAreMembers',
    description: 'All org. admins are members of this group message',
    defaultMessage: 'All organization administrators in this organization are members of this group.',
  },
  allUsersAreMembers: {
    id: 'allUsersAreMembers',
    description: 'All users are members of this group message',
    defaultMessage: 'All users in this organization are members of this group.',
  },
  noGroupMembers: {
    id: 'noGroupMembers',
    description: 'No members in a given group title',
    defaultMessage: 'There are no members in this group',
  },
  addUserToConfigure: {
    id: 'addUserToConfigure',
    description: 'Add a user to configure user access message',
    defaultMessage: 'Add a user to configure user access.',
  },
  addingGroupRolesTitle: {
    id: 'addingGroupRolesTitle',
    description: 'Adding group roles notification title',
    defaultMessage: 'Adding roles to group',
  },
  addingGroupRolesCancelled: {
    id: 'addingGroupRolesCancelled',
    description: 'Adding group roles cancelled notification description',
    defaultMessage: 'Adding roles to group was canceled by the user.',
  },
  addRoleToGroup: {
    id: 'addRoleToGroup',
    description: 'Add role to group label',
    defaultMessage: 'Add role to group',
  },
  addRolesToGroup: {
    id: 'addRolesToGroup',
    description: 'Add roles to group label',
    defaultMessage: 'Add roles to group',
  },
  onlyGroupRolesVisible: {
    id: 'onlyGroupRolesVisible',
    description: 'Message warning that only roles in given role has been filtered',
    defaultMessage: 'This role list has been filtered to only show roles that are not currently in <b>{name}</b>',
  },
  defaultAccessGroupEditWarning: {
    id: 'defaultAccessGroupEditWarning',
    description: 'Message warning that editing a Default access group will rename it',
    defaultMessage:
      'Once you edit the <b>Default access</b> group, the system will no longer update it with new default access roles. The group name will change to <b>Custom default access</b>.',
  },
  warning: {
    id: 'warning',
    description: 'Waring label',
    defaultMessage: 'Warning',
  },
  continue: {
    id: 'continue',
    description: 'Continue label',
    defaultMessage: 'Continue',
  },
  allRolesAdded: {
    id: 'allRolesAdded',
    description: 'All roles already to the group message',
    defaultMessage: 'All available roles have already been added to the group',
  },
  removeRoleModalText: {
    id: 'removeRoleModalText',
    description: 'Remove role message warning about losing permissions',
    defaultMessage: 'Members in the <b>{name}</b> group will lose the permissions in the <b>{role}</b> role',
  },
  removeRolesModalText: {
    id: 'removeRolesModalText',
    description: 'Remove role message warning about losing permissions',
    defaultMessage: 'Members in the <b>{name}</b> group will lose the permissions in these <b>{roles}</b> roles',
  },
  removeRole: {
    id: 'removeRole',
    description: 'Remove role label',
    defaultMessage: 'Remove role',
  },
  removeRoles: {
    id: 'removeRoles',
    description: 'Remove roles label',
    defaultMessage: 'Remove roles',
  },
  removeRoleQuestion: {
    id: 'removeRoleQuestion',
    description: 'Remove role question label',
    defaultMessage: 'Remove role?',
  },
  removeRolesQuestion: {
    id: 'removeRolesQuestion',
    description: 'Remove roles question label',
    defaultMessage: 'Remove roles?',
  },
  defaultGroupNotManually: {
    id: 'defaultGroupNotManually',
    description: 'Message warning that default admin access group cannot be modified manually',
    defaultMessage: 'Default admin access group roles cannot be modified manually',
  },
  noGroupRoles: {
    id: 'noGroupRoles',
    description: 'No roles in a group message',
    defaultMessage: 'There are no roles in this group',
  },
  contactServiceTeamForRoles: {
    id: 'contactServiceTeamForRoles',
    description: 'Contact service team to add roles message',
    defaultMessage: 'Contact your platform service team to add roles.',
  },
  addRoleToConfigureAccess: {
    id: 'addRoleToConfigureAccess',
    description: 'Add role to configure user access message',
    defaultMessage: 'Add a role to configure user access.',
  },
  editGroupInfo: {
    id: 'editGroupInfo',
    description: "Edit group's information message",
    defaultMessage: "Edit group's information",
  },
  orgAdminInheritedRoles: {
    id: 'orgAdminInheritedRoles',
    description: 'Org. Admin inherited roles message',
    defaultMessage: 'This group contains the roles that all org admin users inherit by default.',
  },
  usersInheritedRoles: {
    id: 'usersInheritedRoles',
    description: 'Users inherited roles message',
    defaultMessage: 'This group contains the roles that all users in your organization inherit by default.',
  },
  invalidGroup: {
    id: 'invalidGroup',
    description: 'Invalid group message',
    defaultMessage: 'Invalid group',
  },
  invalidRole: {
    id: 'invalidRole',
    description: 'Invalid role message',
    defaultMessage: 'Invalid role',
  },
  invalidUser: {
    id: 'invalidUser',
    description: 'Invalid user message',
    defaultMessage: 'Invalid user',
  },
  defaultAccessGroupNameChanged: {
    id: 'defaultAccessGroupNameChanged',
    description: 'Default access group renamed message',
    defaultMessage:
      'Now that you have edited the <b>Default access</b> group, the system will no longer update it with new default access roles. The group name has changed to <b>Custom default access</b>.',
  },
  defaultAccessGroupChanged: {
    id: 'defaultAccessGroupChanged',
    description: 'Default access group changed message',
    defaultMessage: 'Default access group has changed',
  },
  groupNotFound: {
    id: 'groupNotFound',
    description: 'Group not found message',
    defaultMessage: 'Group not found',
  },
  groupDoesNotExist: {
    id: 'groupDoesNotExist',
    description: 'Group with given ID does not exist message',
    defaultMessage: 'Group with ID {id} does not exist.',
  },
  backToPreviousPage: {
    id: 'backToPreviousPage',
    description: 'Back to previous page label',
    defaultMessage: 'Back to previous page',
  },
  deleteGroupsQuestion: {
    id: 'deleteGroupsQuestion',
    description: 'Delete groups question label',
    defaultMessage: 'Delete groups?',
  },
  deleteGroupQuestion: {
    id: 'deleteGroupQuestion',
    description: 'Delete group question label',
    defaultMessage: 'Delete group?',
  },
  deleteGroups: {
    id: 'deleteGroups',
    description: 'Delete groups label',
    defaultMessage: 'Delete groups',
  },
  deleteGroup: {
    id: 'deleteGroup',
    description: 'Delete group label',
    defaultMessage: 'Delete group',
  },
  deletingGroupRemovesRoles: {
    id: 'deletingGroupRemovesRoles',
    description: 'Delete group label',
    defaultMessage: 'Deleting the <b>{name}</b> group removes all roles from the members inside the group.',
  },
  deletingGroupsRemovesRoles: {
    id: 'deletingGroupsRemovesRoles',
    description: 'Delete groups label',
    defaultMessage: 'Deleting these <b>{count}</b> groups removes all roles from the members inside the groups.',
  },
  understandActionIrreversible: {
    id: 'understandActionIrreversible',
    description: 'Understand action cannot be undone message',
    defaultMessage: 'I understand that this action cannot be undone.',
  },
  nameAlreadyTaken: {
    id: 'nameAlreadyTaken',
    description: 'Name has been already taken validation message',
    defaultMessage: 'Name has already been taken.',
  },
  appServicesNotManaged: {
    id: 'appServicesNotManaged',
    description: 'Application Services permissions are not managed with User Access message',
    defaultMessage: 'Application Services permissions are not managed with User Access',
  },
  allUsersViewEverything: {
    id: 'allUsersViewEverything',
    description: 'All users in the organization may view everything message',
    defaultMessage: 'All users in the organization may view everything.',
  },
  actionsOnClustersPermissions: {
    id: 'actionsOnClustersPermissions',
    description: 'Actions on clusters permissions message',
    defaultMessage: 'Only Org. Administrators and cluster owners can perform actions on clusters.',
  },
  openshiftPermissions: {
    id: 'openshiftPermissions',
    description: 'Openshift permissions message',
    defaultMessage:
      'All users in the organization may view everything, but only Org. Administrators and cluster owners can perform actions on clusters. The table below displays roles for other OpenShift applications and services.',
  },
  application: {
    id: 'application',
    description: 'Application label',
    defaultMessage: 'Application',
  },
  permission: {
    id: 'permission',
    description: 'Permission label',
    defaultMessage: 'Permission',
  },
  permissions: {
    id: 'permissions',
    description: 'Permissions label',
    defaultMessage: 'Permissions',
  },
  resourceType: {
    id: 'resourceType',
    description: 'Resource type label',
    defaultMessage: 'Resource type',
  },
  operation: {
    id: 'operation',
    description: 'Operation label',
    defaultMessage: 'Operation',
  },
  resourceDefinitions: {
    id: 'resourceDefinitions',
    description: 'Resource definitions label',
    defaultMessage: 'Resource definitions',
  },
  resourceDefinition: {
    id: 'resourceDefinition',
    description: 'Resource definition label',
    defaultMessage: 'Resource definition',
  },
  noPermissionsForInsights: {
    id: 'noPermissionsForInsights',
    description: 'No individual permissions for Insights message',
    defaultMessage: 'You do not have individual permissions for Insights.',
  },
  contactOrgAdministrator: {
    id: 'contactOrgAdministrator',
    description: 'Contact org. administrator for more info message',
    defaultMessage: 'Contact your Org. Administrator for more information.',
  },
  notSubscribed: {
    id: 'notSubscribed',
    description: 'Not subscribed label',
    defaultMessage: 'Not subscribed',
  },
  yourRoles: {
    id: 'yourRoles',
    description: 'Your bundle roles label',
    defaultMessage: 'Your {name} roles',
  },
  yourPermissions: {
    id: 'yourPermissions',
    description: 'Your bundle permissions label',
    defaultMessage: 'Your {name} permissions',
  },
  myUserAccess: {
    id: 'myUserAccess',
    description: 'My User Access label',
    defaultMessage: 'My User Access',
  },
  selectAppsToViewPermissions: {
    id: 'selectAppsToViewPermissions',
    description: 'Select applications to view your personal permissions message',
    defaultMessage: 'Select applications to view your personal permissions.',
  },
  chooseSubscriptionEllipsis: {
    id: 'chooseSubscriptionEllipsis',
    description: 'Choose subscription message',
    defaultMessage: 'Choose a subscription...',
  },
  viewResourceDefinitions: {
    id: 'viewResourceDefinitions',
    description: 'View resource definitions message',
    defaultMessage: 'View resource definitions for the <strong>{permission}</strong> permission',
  },
  noResourceDefinitions: {
    id: 'noResourceDefinitions',
    description: 'There are no resource definitions for permission message',
    defaultMessage: 'There are no resource definitions for {permission} permission',
  },
  creatingRoleCanceled: {
    id: 'creatingRoleCanceled',
    description: 'Creating role canceled notification message',
    defaultMessage: 'Creating role was canceled by the user',
  },
  permissionStringDescription: {
    id: 'permissionStringDescription',
    description: 'Permission string description text',
    defaultMessage:
      'The permission string is made up of the following inputs where it denotes which application and the resource type the permission will be allowed for.',
  },
  key: {
    id: 'key',
    description: 'Key label',
    defaultMessage: 'Key',
  },
  value: {
    id: 'value',
    description: 'Value label',
    defaultMessage: 'Value',
  },
  permissionResourcesDetails: {
    id: 'permissionResourcesDetails',
    description: 'Permission resources details message',
    defaultMessage: 'If there needs to be more details on the resources the permission is to be used for, it would be detailed here.',
  },
  addToDefinitions: {
    id: 'addToDefinitions',
    description: 'Add to definitions message',
    defaultMessage: 'Add to definitions',
  },
  confirmDetails: {
    id: 'confirmDetails',
    description: 'Confirm details message',
    defaultMessage: 'Confirm details',
  },
  confirmDetailsDescription: {
    id: 'confirmDetailsDescription',
    description: 'Confirm details description message',
    defaultMessage: 'Confirm the details for your source, or click Back to revise',
  },
  selectedPermissions: {
    id: 'selectedPermissions',
    description: 'Selected permissions label',
    defaultMessage: 'Selected permissions',
  },
  addPermissions: {
    id: 'addPermissions',
    description: 'Add permissions label',
    defaultMessage: 'Add permissions',
  },
  addPermission: {
    id: 'addPermission',
    description: 'Add permission label',
    defaultMessage: 'Add permission',
  },
  selectPermissionsForRole: {
    id: 'selectPermissionsForRole',
    description: 'Select permissions for role label',
    defaultMessage: 'Select permissions to add to your role',
  },
  onlyGranularPermissions: {
    id: 'onlyGranularPermissions',
    description: 'Only granular permissions message',
    defaultMessage: 'Custom roles only support granular permissions',
  },
  noWildcardPermissions: {
    id: 'noWildcardPermissions',
    description: 'No wildcard permissions message',
    defaultMessage: 'Wildcard permissions (for example, approval:*:*) aren’t included in this table and can’t be added to your custom role.',
  },
  whyNotSeeingAllPermissions: {
    id: 'whyNotSeeingAllPermissions',
    description: 'Why am I not seeing all of my permissions message',
    defaultMessage: 'Why am I not seeing all of my permissions?',
  },
  followingPermissionsCannotBeAdded: {
    id: 'followingPermissionsCannotBeAdded',
    description: 'Following permissions cannot be added message',
    defaultMessage: 'The following permissions can not be added to a custom role and were removed from the copied role:',
  },
  configureResourcesForPermission: {
    id: 'configureResourcesForPermission',
    description: 'Configure resources for permission message',
    defaultMessage: 'To add this permission to your role and define specific resources for it, at least one data source must be connected.',
  },
  noCostManagementPermissions: {
    id: 'noCostManagementPermissions',
    description: 'No Cost management permissions message',
    defaultMessage: 'You are not entitled to add cost-management permissions to your role.',
  },
  configureCostSources: {
    id: 'configureCostSources',
    description: 'Configure resources for Cost management message',
    defaultMessage: 'Configure sources for Cost Management',
  },
  noResultsFound: {
    id: 'noResultsFound',
    description: 'No results found message',
    defaultMessage: 'No results found',
  },
  permissionNotDisplayedDescription: {
    id: 'permissionNotDisplayedDescription',
    description: 'Permission not displayed description message',
    defaultMessage:
      "The permission either does not exist or has already been added to this role. Adjust your filters and try again. Note: Applications that only have wildcard permissions (for example, compliance:*:*) aren't included in this table and can't be added to your custom role.",
  },
  seeLess: {
    id: 'seeLess',
    description: 'See less label',
    defaultMessage: 'See less',
  },
  seeMore: {
    id: 'seeMore',
    description: 'See more label',
    defaultMessage: 'See more',
  },
  roleCreatedSuccessfully: {
    id: 'roleCreatedSuccessfully',
    description: 'Role created successfully message',
    defaultMessage: 'You have successfully created a new role',
  },
  createAnotherRole: {
    id: 'createAnotherRole',
    description: 'Create another role message',
    defaultMessage: 'Create another role',
  },
  granularPermissionsWillBeCopied: {
    id: 'granularPermissionsWillBeCopied',
    description: 'Granular permissions will be copied message',
    defaultMessage:
      'Only granular permissions will be copied into a custom role (for example, approval:requests:read). Wildcard permissions will not be copied into a custom role (for example, approval:*:read).',
  },
  selectState: {
    id: 'selectState',
    description: 'Select state label',
    defaultMessage: 'Select a state',
  },
  selectResources: {
    id: 'selectResources',
    description: 'Select resources label',
    defaultMessage: 'Select resources',
  },
  reviewRoleDetails: {
    id: 'reviewRoleDetails',
    description: 'Review role details text',
    defaultMessage: 'Review and confirm the details for your role, or click Back to revise.',
  },
  createRole: {
    id: 'createRole',
    description: 'Create role label',
    defaultMessage: 'Create role',
  },
  defineCostResources: {
    id: 'defineCostResources',
    description: 'Define Cost Management resources label',
    defaultMessage: 'Define Cost Management resources',
  },
  applyCostPermissionText: {
    id: 'applyCostPermissionText',
    description: 'Apply Cost permission text',
    defaultMessage: 'Specify where you would like to apply each cost permission selected in the previous step, using the dropdown below.',
  },
  createRoleFromScratch: {
    id: 'createRoleFromScratch',
    description: 'Create role from scratch option',
    defaultMessage: 'Create a role from scratch',
  },
  copyAnExistingRole: {
    id: 'copyAnExistingRole',
    description: 'Copy an existing role option',
    defaultMessage: 'Copy an existing role',
  },
  permissionsAddedSuccessfully: {
    id: 'permissionsAddedSuccessfully',
    description: 'Permissions added successfully message',
    defaultMessage: 'You have successfully added permissions to the role',
  },
  addedPermissions: {
    id: 'addedPermissions',
    description: 'Added permissions label',
    defaultMessage: 'Added permissions',
  },
  assignAtLeastOneResource: {
    id: 'assignAtLeastOneResource',
    description: 'Assign at least one resource message',
    defaultMessage: 'You need to assign at least one resource to each permission.',
  },
  resourcesAvailable: {
    id: 'resourcesAvailable',
    description: 'Resources available for permission message',
    defaultMessage: 'Resources available for the permission',
  },
  resourcesDefined: {
    id: 'resourcesDefined',
    description: 'Resources defined for permission message',
    defaultMessage: 'Resources defined for the permission',
  },
  filterByResource: {
    id: 'filterByResource',
    description: 'Filter by resource label',
    defaultMessage: 'Filter by resource...',
  },
  exitEditResourceDefinitions: {
    id: 'exitEditResourceDefinitions',
    description: 'Exit edit resource definitions question text',
    defaultMessage: 'Exit edit resource definitions?',
  },
  changesWillBeLost: {
    id: 'changesWillBeLost',
    description: 'All changes will be lost message',
    defaultMessage: 'All changes will be lost',
  },
  editResourceDefinitions: {
    id: 'editResourceDefinitions',
    description: 'Edit resource definitions label',
    defaultMessage: 'Edit resource definitions',
  },
  editPermissionsUsingArrows: {
    id: 'editPermissionsUsingArrows',
    description: 'Edit permissions using arrows label',
    defaultMessage: 'Give or remove permissions to specific resources using the arrows below.',
  },
  roleWithNameExists: {
    id: 'roleWithNameExists',
    description: 'Role with name exists message',
    defaultMessage: 'Role with this name already exists.',
  },
  deleteRoleQuestion: {
    id: 'deleteRoleQuestion',
    description: 'Delete role question message',
    defaultMessage: 'Delete role?',
  },
  roleWilBeRemovedWithPermissions: {
    id: 'roleWilBeRemovedWithPermissions',
    description: 'Role will be removed with permissions message',
    defaultMessage:
      "{count, plural, one {The} other {These}} <strong>{name}</strong> {count, plural, one {role} other {roles}} will be removed from any group it's in, and members in the groups will no longer be granted the permissions in the role.",
  },
  defineAtLeastOneResource: {
    id: 'defineAtLeastOneResource',
    description: 'Define at least one resource message',
    defaultMessage: 'At least one resource must be defined for this permission',
  },
  permissionWillNotBeGrantedThroughRole: {
    id: 'permissionWillNotBeGrantedThroughRole',
    description: 'Permission will not be granted through role message',
    defaultMessage: 'The <b>{permission}</b> permission will no longer be granted through the <b>{role}</b> role.',
  },
  permissionsWillNotBeGrantedThroughRole: {
    id: 'permissionsWillNotBeGrantedThroughRole',
    description: 'Permissions will not be granted through role message',
    defaultMessage: 'The <b>{permissions}</b> permissions will no longer be granted through the <b>{role}</b> role.',
  },
  lastCommit: {
    id: 'lastCommit',
    description: 'Last commit label',
    defaultMessage: 'Last commit',
  },
  resourceDefinitionsApplyToCost: {
    id: 'resourceDefinitionsApplyToCost',
    description: 'Resource definitions only apply to Cost Management permissions message',
    defaultMessage: 'Resource definitions only apply to Cost Management permissions',
  },
  removePermissionQuestion: {
    id: 'removePermissionQuestion',
    description: 'Remove permission question text',
    defaultMessage: 'Remove permission?',
  },
  removePermission: {
    id: 'removePermission',
    description: 'Remove permission label',
    defaultMessage: 'Remove permission',
  },
  removePermissionsQuestion: {
    id: 'removePermissionsQuestion',
    description: 'Remove permissions question text',
    defaultMessage: 'Remove permissions?',
  },
  removePermissions: {
    id: 'removePermissions',
    description: 'Remove permissions label',
    defaultMessage: 'Remove permissions',
  },
  noRolePermissions: {
    id: 'noRolePermissions',
    description: 'No role permissions text',
    defaultMessage: 'There are no permissions in this role',
  },
  definedResources: {
    id: 'definedResources',
    description: 'Defined resources label',
    defaultMessage: 'Defined resources',
  },
  resource: {
    id: 'resource',
    description: 'Resource label',
    defaultMessage: 'Resource',
  },
  resources: {
    id: 'resources',
    description: 'Resources label',
    defaultMessage: 'Resources',
  },
  userDescription: {
    id: 'userDescription',
    description: 'User description text',
    defaultMessage: "{username}'s roles, groups and permissions.",
  },
  userNotFound: {
    id: 'userNotFound',
    description: 'User not found text',
    defaultMessage: 'User not found',
  },
  userNotFoundDescription: {
    id: 'userNotFoundDescription',
    description: 'User not found description text',
    defaultMessage: 'User with username {username} does not exist.',
  },
  addNewUsersText: {
    id: 'addNewUsersText',
    description: 'Add new users text',
    defaultMessage: 'To add new users or manage existing users, go to your',
  },
  triggerMyQuickstart: {
    id: 'triggerMyQuickstart',
    description: 'Trigger my quickstart text',
    defaultMessage: 'Trigger my quickstart',
  },
  triggerMyCatalog: {
    id: 'triggerMyCatalog',
    description: 'Trigger my catalog text',
    defaultMessage: 'Trigger my catalog',
  },
  restoreDefaultAccessQuestion: {
    id: 'restoreDefaultAccessQuestion',
    description: 'Restore Default access group question',
    defaultMessage: 'Restore Default access group?',
  },
  restoreToDefault: {
    id: 'restoreToDefault',
    description: 'Restore to default label',
    defaultMessage: 'Restore to default',
  },
  restoreDefaultAccessInfo: {
    id: 'restoreDefaultAccessInfo',
    description: 'Restore Custom Default Access group info',
    defaultMessage:
      'This restores <b>Default access</b> group and removes <b>Custom default access</b> group. All configurations in <b>Custom default access</b> are deleted and cannot be recovered.',
  },
  restoreDefaultAccessDescription: {
    id: 'restoreDefaultAccessDescription',
    description: 'Restore Custom Default Access group description',
    defaultMessage:
      'Restoring <b>Default access</b> group will remove <b>Custom default access</b> group. <b>Custom default access</b> configurations cannot be recovered. Are you sure?',
  },
  noGroups: {
    id: 'noGroups',
    description: 'No groups label',
    defaultMessage: 'No groups',
  },
  noPermissions: {
    id: 'noPermissions',
    description: 'No permissions label',
    defaultMessage: 'No permissions',
  },
});
