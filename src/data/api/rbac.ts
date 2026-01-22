/**
 * RBAC API
 * 
 * Simple closure that takes an axios client and returns all API functions.
 * No React dependencies - can be used by browser, CLI, or tests.
 */

import type { AxiosInstance } from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
  system?: boolean;
  platform_default?: boolean;
  admin_default?: boolean;
  created?: string;
  modified?: string;
  policyCount?: number;
  accessCount?: number;
}

export interface RoleIn {
  name: string;
  display_name?: string;
  description?: string;
  access: Array<{ permission: string; resourceDefinitions?: unknown[] }>;
}

export interface Group {
  uuid: string;
  name: string;
  description?: string;
  principalCount?: number | string;
  roleCount?: number;
  platform_default?: boolean;
  admin_default?: boolean;
  system?: boolean;
  created?: string;
  modified?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  type?: 'root' | 'default' | 'standard';
  created?: string;
  modified?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { count: number };
}

// ============================================================================
// API Factory
// ============================================================================

export function createRbacApi(client: AxiosInstance) {
  const v2BaseUrl = () => client.defaults.baseURL?.replace('/v1', '');

  return {
    roles: {
      list: (params?: { limit?: number; offset?: number; name?: string; system?: boolean; orderBy?: string }) =>
        client.get<PaginatedResponse<Role>>('/roles/', { params }).then((r) => r.data),

      get: (uuid: string) =>
        client.get<Role>(`/roles/${uuid}/`).then((r) => r.data),

      create: (data: RoleIn) =>
        client.post<Role>('/roles/', data).then((r) => r.data),

      update: (uuid: string, data: Partial<RoleIn>) =>
        client.put<Role>(`/roles/${uuid}/`, data).then((r) => r.data),

      patch: (uuid: string, data: { name?: string; display_name?: string; description?: string }) =>
        client.patch<Role>(`/roles/${uuid}/`, data).then((r) => r.data),

      delete: (uuid: string) =>
        client.delete(`/roles/${uuid}/`),

      getAccess: (uuid: string, params?: { limit?: number; offset?: number }) =>
        client.get(`/roles/${uuid}/access/`, { params }).then((r) => r.data),
    },

    groups: {
      list: (params?: { limit?: number; offset?: number; name?: string; system?: boolean; platformDefault?: boolean; adminDefault?: boolean; orderBy?: string }) =>
        client.get<PaginatedResponse<Group>>('/groups/', {
          params: {
            ...params,
            platform_default: params?.platformDefault,
            admin_default: params?.adminDefault,
            order_by: params?.orderBy,
          },
        }).then((r) => r.data),

      get: (uuid: string) =>
        client.get<Group>(`/groups/${uuid}/`).then((r) => r.data),

      create: (data: { name: string; description?: string }) =>
        client.post<Group>('/groups/', data).then((r) => r.data),

      update: (uuid: string, data: { name: string; description?: string }) =>
        client.put<Group>(`/groups/${uuid}/`, data).then((r) => r.data),

      delete: (uuid: string) =>
        client.delete(`/groups/${uuid}/`),

      getMembers: (uuid: string, params?: { limit?: number; offset?: number }) =>
        client.get(`/groups/${uuid}/principals/`, { params: { ...params, principal_type: 'user' } }).then((r) => r.data),

      addMembers: (uuid: string, usernames: string[]) =>
        client.post(`/groups/${uuid}/principals/`, { principals: usernames.map((u) => ({ username: u })) }),

      removeMembers: (uuid: string, usernames: string[]) =>
        client.delete(`/groups/${uuid}/principals/`, { params: { usernames: usernames.join(',') } }),

      getRoles: (uuid: string, params?: { limit?: number; offset?: number }) =>
        client.get(`/groups/${uuid}/roles/`, { params }).then((r) => r.data),

      addRoles: (uuid: string, roleUuids: string[]) =>
        client.post(`/groups/${uuid}/roles/`, { roles: roleUuids }),

      removeRoles: (uuid: string, roleUuids: string[]) =>
        client.delete(`/groups/${uuid}/roles/`, { params: { roles: roleUuids.join(',') } }),
    },

    workspaces: {
      list: (params?: { limit?: number; offset?: number; name?: string; type?: string }) =>
        client.get<PaginatedResponse<Workspace>>('/v2/workspaces/', {
          baseURL: v2BaseUrl(),
          params: { type: 'all', ...params },
        }).then((r) => r.data),

      get: (id: string) =>
        client.get<Workspace>(`/v2/workspaces/${id}/`, { baseURL: v2BaseUrl() }).then((r) => r.data),

      create: (data: { name: string; description?: string; parent_id?: string }) =>
        client.post<Workspace>('/v2/workspaces/', data, { baseURL: v2BaseUrl() }).then((r) => r.data),

      update: (id: string, data: { name?: string; description?: string }) =>
        client.patch<Workspace>(`/v2/workspaces/${id}/`, data, { baseURL: v2BaseUrl() }).then((r) => r.data),

      delete: (id: string) =>
        client.delete(`/v2/workspaces/${id}/`, { baseURL: v2BaseUrl() }),

      move: (id: string, parentId: string) =>
        client.post<Workspace>(`/v2/workspaces/${id}/move/`, { parent_id: parentId }, { baseURL: v2BaseUrl() }).then((r) => r.data),
    },
  };
}

export type RbacApi = ReturnType<typeof createRbacApi>;
