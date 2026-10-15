export { GroupDetailsDrawer } from './GroupDetailsDrawer';
export { BaseGroupAssignmentsTable } from './BaseGroupAssignmentsTable';
export { InheritedGroupAssignmentsTable } from './InheritedGroupAssignmentsTable';
export { RoleAccessModal } from './RoleAccessModal';

// Re-export types that might be needed by consumers
export type { WorkspaceGroupRow, InheritedWorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
export type { User } from '../../../../../shared/data/queries/users';
export type { Role } from '../../../../data/queries/roles';
