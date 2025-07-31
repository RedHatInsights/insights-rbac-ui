import { EXPAND_SPLATS, RESET_EXPAND_SPLATS } from '../cost-management/action-types';
import { LIST_APPLICATION_OPTIONS, LIST_OPERATION_OPTIONS, LIST_PERMISSIONS, LIST_RESOURCE_OPTIONS } from './action-types';
import { listPermissionOptions as listPermissionOptionsHelper, listPermissions as listPermissionsHelper } from './helper';

// Define interfaces for action parameters based on actual usage
interface ListPermissionsParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  application?: string;
  resourceType?: string;
  verb?: string;
  permission?: string;
  exclude_globals?: boolean;
  exclude_roles?: string; // Role ID to exclude
  allowed_only?: boolean;
  options?: Record<string, unknown>;
}

interface ListPermissionOptionsParams {
  field: 'application' | 'resource_type' | 'verb';
  limit?: number;
  offset?: number;
  application?: string;
  resourceType?: string;
  verb?: string;
  allowedOnly?: boolean;
  options?: Record<string, unknown>;
}

interface ExpandSplatsParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  application?: string;
  resourceType?: string;
  verb?: string;
  permission?: string;
  exclude_globals?: boolean;
  options?: Record<string, unknown>;
}

// Using global ReduxAction interface from store.d.ts
export const listPermissions = ({
  limit,
  offset,
  orderBy,
  application,
  resourceType,
  verb,
  permission,
  exclude_globals = true,
  exclude_roles,
  allowed_only,
  options,
}: ListPermissionsParams): ReduxAction<Promise<unknown>> => ({
  type: LIST_PERMISSIONS,
  payload: listPermissionsHelper(
    limit,
    offset,
    orderBy,
    application,
    resourceType,
    verb,
    permission,
    exclude_globals,
    exclude_roles,
    allowed_only,
    options,
  ),
});

const fieldToAction: Record<string, string> = {
  application: LIST_APPLICATION_OPTIONS,
  resource_type: LIST_RESOURCE_OPTIONS,
  verb: LIST_OPERATION_OPTIONS,
} as const;

export const listPermissionOptions = ({
  field,
  limit,
  offset,
  application,
  resourceType,
  verb,
  allowedOnly,
  options,
}: ListPermissionOptionsParams): ReduxAction<Promise<unknown>> => ({
  type: fieldToAction[field],
  payload: listPermissionOptionsHelper(field, limit, offset, application, resourceType, verb, allowedOnly, options),
});

export const expandSplats = ({
  limit = 1000,
  offset = 0,
  orderBy,
  application,
  resourceType,
  verb,
  permission,
  exclude_globals = true,
  options,
}: ExpandSplatsParams): ReduxAction<Promise<unknown>> => ({
  type: EXPAND_SPLATS,
  payload: listPermissionsHelper(limit, offset, orderBy, application, resourceType, verb, permission, exclude_globals, undefined, undefined, options),
});

export const resetExpandSplats = (): ReduxAction<{ data: unknown[] }> => ({
  type: RESET_EXPAND_SPLATS,
  payload: {
    data: [],
  },
});
