export { GroupDetailsDrawer } from './GroupDetailsDrawer';
export { BaseGroupAssignmentsTable } from './BaseGroupAssignmentsTable';
export { InheritedGroupAssignmentsTable } from './InheritedGroupAssignmentsTable';

// Re-export types that might be needed by consumers
export type { Group } from '../../../../data/queries/groups';
export type { GroupWithInheritance } from './GroupDetailsDrawer';
export type { Principal as User } from '../../../../data/queries/users';
export type { Role } from '../../../../data/queries/roles';
