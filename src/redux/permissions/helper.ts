import { getAccessApi } from '../../api/httpClient';

// Type interfaces for parameters
interface Permission {
  permission: string;
  [key: string]: unknown;
}

interface PermissionsResponse {
  data: Permission[];
  [key: string]: unknown;
}

const accessApi = getAccessApi();

const disallowedPermissions: string[] = ['inventory:staleness'];

export async function listPermissions(
  limit?: number,
  offset?: number,
  orderBy?: string,
  application?: string,
  resourceType?: string,
  verb?: string,
  permission?: string,
  excludeGlobals?: boolean,
  excludeRoles?: string, // Changed from boolean to string for role ID
  allowedOnly?: boolean,
  options?: Record<string, unknown>,
): Promise<PermissionsResponse> {
  // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
  // - API expects undefined for optional parameters, not explicit defaults
  // - Using (apiMethod as any) to bypass broken type definitions
  const response = await (accessApi.listPermissions as any)(
    limit,
    offset,
    orderBy,
    application,
    resourceType,
    verb,
    permission,
    excludeGlobals,
    excludeRoles,
    allowedOnly,
    options,
  );

  // If responseInterceptor fully unwraps to just the data array, return proper structure
  // Otherwise, if it's still an object with data property, spread and filter
  if (Array.isArray(response)) {
    return {
      data: response.filter(({ permission }: Permission) => !disallowedPermissions.some((item) => permission.includes(item))),
    };
  } else {
    const responseObj = response as any; // Use any since the API types are broken
    return {
      ...responseObj,
      data: responseObj.data.filter(({ permission }: Permission) => !disallowedPermissions.some((item) => permission.includes(item))),
    };
  }
}

export async function listPermissionOptions(
  field: string,
  limit?: number,
  offset?: number,
  application?: string,
  resourceType?: string,
  verb?: string,
  allowedOnly?: boolean,
  options?: Record<string, unknown>,
): Promise<unknown> {
  // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
  // - Using (apiMethod as any) to bypass broken type definitions
  return await (accessApi.listPermissionOptions as any)(
    field,
    limit,
    offset,
    application,
    resourceType,
    verb,
    undefined, // parameter position for consistency
    allowedOnly,
    options,
  );
}
