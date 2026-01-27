/**
 * Immutable State Management for MSW Handlers
 *
 * This module provides type-safe immutable state operations to prevent
 * the spread operator bugs and state pollution we've been experiencing.
 *
 * Key principles:
 * 1. All state updates return NEW objects (never mutate)
 * 2. Deep cloning for nested structures
 * 3. Type-safe operations
 * 4. No spread operators on complex objects
 */

import { Group, Principal, Role } from '../types/entities';
import type { RoleBindingsRoleBindingBySubject, WorkspacesWorkspace } from '../../src/data/queries/workspaces';

// Type aliases for backward compatibility with existing mock data
type Workspace = WorkspacesWorkspace;
type RoleBindingBySubject = RoleBindingsRoleBindingBySubject;

export interface ServiceAccount {
  id: string;
  name: string;
  clientId: string;
  description: string;
  createdBy: string;
  createdAt: number; // Unix timestamp in seconds
}

export interface AppState {
  groups: Group[];
  users: Principal[];
  roles: Role[];
  workspaces: Workspace[];
  serviceAccounts: ServiceAccount[];
  // Track which users belong to which groups
  groupMembers: Map<string, Principal[]>;
  // Track which roles are assigned to which groups
  groupRoles: Map<string, Role[]>;
  // Track workspace-specific role bindings (M3+ feature)
  workspaceRoleBindings: Map<string, RoleBindingBySubject[]>;
}

/**
 * Deep clone a Map with array values
 */
function cloneMap<K, V>(map: Map<K, V[]>): Map<K, V[]> {
  const newMap = new Map<K, V[]>();
  map.forEach((value, key) => {
    // Create new array with cloned items
    newMap.set(
      key,
      value.map((item) => ({ ...item }) as V),
    );
  });
  return newMap;
}

/**
 * Deep clone a Group object
 */
function cloneGroup(group: Group): Group {
  return {
    uuid: group.uuid,
    name: group.name,
    description: group.description,
    principalCount: group.principalCount,
    roleCount: group.roleCount,
    created: group.created,
    modified: group.modified,
    platform_default: group.platform_default,
    admin_default: group.admin_default,
    system: group.system,
  };
}

/**
 * Deep clone the entire AppState
 */
export function cloneState(state: AppState): AppState {
  return {
    groups: state.groups.map(cloneGroup),
    users: state.users.map((u) => ({ ...u })),
    roles: state.roles.map((r) => ({ ...r })),
    workspaces: state.workspaces.map((w) => ({ ...w })),
    serviceAccounts: state.serviceAccounts.map((sa) => ({ ...sa })),
    groupMembers: cloneMap(state.groupMembers),
    groupRoles: cloneMap(state.groupRoles),
    workspaceRoleBindings: cloneMap(state.workspaceRoleBindings),
  };
}

/**
 * Update a group in the state (immutably)
 * Returns a NEW state object with the updated group
 */
export function updateGroup(state: AppState, groupId: string, updates: Partial<Group>): AppState {
  const groupIndex = state.groups.findIndex((g) => g.uuid === groupId);
  if (groupIndex === -1) {
    return state; // Group not found, return unchanged state
  }

  const oldGroup = state.groups[groupIndex];
  const newGroup = cloneGroup(oldGroup);

  // Apply updates explicitly (no spread!)
  if (updates.name !== undefined) newGroup.name = updates.name;
  if (updates.description !== undefined) newGroup.description = updates.description;
  if (updates.system !== undefined) newGroup.system = updates.system;
  if (updates.modified !== undefined) newGroup.modified = updates.modified;
  if (updates.principalCount !== undefined) newGroup.principalCount = updates.principalCount;
  if (updates.roleCount !== undefined) newGroup.roleCount = updates.roleCount;
  if (updates.platform_default !== undefined) newGroup.platform_default = updates.platform_default;
  if (updates.admin_default !== undefined) newGroup.admin_default = updates.admin_default;

  // Create new groups array with the updated group
  const newGroups = [...state.groups];
  newGroups[groupIndex] = newGroup;

  return {
    ...state,
    groups: newGroups,
  };
}

/**
 * Add roles to a group (immutably)
 * Returns a NEW state object with the updated groupRoles
 */
export function addRolesToGroup(state: AppState, groupId: string, roleUuids: string[]): AppState {
  const currentRoles = state.groupRoles.get(groupId) || [];
  const newRoles = [...currentRoles];

  roleUuids.forEach((roleUuid) => {
    const role = state.roles.find((r) => r.uuid === roleUuid);
    if (role && !newRoles.find((r) => r.uuid === roleUuid)) {
      newRoles.push({ ...role });
    }
  });

  const newGroupRoles = cloneMap(state.groupRoles);
  newGroupRoles.set(groupId, newRoles);

  // Update roleCount on the group
  const groupIndex = state.groups.findIndex((g) => g.uuid === groupId);
  let newGroups = state.groups;
  if (groupIndex !== -1) {
    newGroups = [...state.groups];
    const group = cloneGroup(state.groups[groupIndex]);
    group.roleCount = newRoles.length;
    group.modified = new Date().toISOString();
    newGroups[groupIndex] = group;
  }

  return {
    ...state,
    groups: newGroups,
    groupRoles: newGroupRoles,
  };
}

/**
 * Remove roles from a group (immutably)
 */
export function removeRolesFromGroup(state: AppState, groupId: string, roleUuids: string[]): AppState {
  const currentRoles = state.groupRoles.get(groupId) || [];
  const newRoles = currentRoles.filter((r) => !roleUuids.includes(r.uuid));

  const newGroupRoles = cloneMap(state.groupRoles);
  newGroupRoles.set(groupId, newRoles);

  // Update roleCount on the group
  const groupIndex = state.groups.findIndex((g) => g.uuid === groupId);
  let newGroups = state.groups;
  if (groupIndex !== -1) {
    newGroups = [...state.groups];
    const group = cloneGroup(state.groups[groupIndex]);
    group.roleCount = newRoles.length;
    group.modified = new Date().toISOString();
    newGroups[groupIndex] = group;
  }

  return {
    ...state,
    groups: newGroups,
    groupRoles: newGroupRoles,
  };
}

/**
 * Add members to a group (immutably)
 */
export function addMembersToGroup(state: AppState, groupId: string, usernames: string[]): AppState {
  const currentMembers = state.groupMembers.get(groupId) || [];
  const newMembers = [...currentMembers];

  usernames.forEach((username) => {
    const user = state.users.find((u) => u.username === username);
    if (user && !newMembers.find((m) => m.username === username)) {
      newMembers.push({ ...user });
    }
  });

  const newGroupMembers = cloneMap(state.groupMembers);
  newGroupMembers.set(groupId, newMembers);

  // Update principalCount on the group
  const groupIndex = state.groups.findIndex((g) => g.uuid === groupId);
  let newGroups = state.groups;
  if (groupIndex !== -1) {
    newGroups = [...state.groups];
    const group = cloneGroup(state.groups[groupIndex]);
    group.principalCount = newMembers.length;
    group.modified = new Date().toISOString();
    newGroups[groupIndex] = group;
  }

  return {
    ...state,
    groups: newGroups,
    groupMembers: newGroupMembers,
  };
}

/**
 * Remove members from a group (immutably)
 */
export function removeMembersFromGroup(state: AppState, groupId: string, usernames: string[]): AppState {
  const currentMembers = state.groupMembers.get(groupId) || [];
  const newMembers = currentMembers.filter((m) => !usernames.includes(m.username || ''));

  const newGroupMembers = cloneMap(state.groupMembers);
  newGroupMembers.set(groupId, newMembers);

  // Update principalCount on the group
  const groupIndex = state.groups.findIndex((g) => g.uuid === groupId);
  let newGroups = state.groups;
  if (groupIndex !== -1) {
    newGroups = [...state.groups];
    const group = cloneGroup(state.groups[groupIndex]);
    group.principalCount = newMembers.length;
    group.modified = new Date().toISOString();
    newGroups[groupIndex] = group;
  }

  return {
    ...state,
    groups: newGroups,
    groupMembers: newGroupMembers,
  };
}

/**
 * Find a group by UUID (returns a clone, never the original)
 */
export function findGroup(state: AppState, groupId: string): Group | undefined {
  const group = state.groups.find((g) => g.uuid === groupId);
  return group ? cloneGroup(group) : undefined;
}

/**
 * Get group members (returns a clone, never the original)
 */
export function getGroupMembers(state: AppState, groupId: string): Principal[] {
  const members = state.groupMembers.get(groupId);
  return members ? members.map((m) => ({ ...m })) : [];
}

/**
 * Get group roles (returns a clone, never the original)
 */
export function getGroupRoles(state: AppState, groupId: string): Role[] {
  const roles = state.groupRoles.get(groupId);
  return roles ? roles.map((r) => ({ ...r })) : [];
}
