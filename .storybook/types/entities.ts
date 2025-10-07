// Core entity types matching the RBAC API responses

export interface Group {
  uuid: string;
  name: string;
  description: string;
  principalCount?: number | string; // String for special groups like "All" or "All org admins"
  roleCount?: number;
  platform_default?: boolean;
  admin_default?: boolean;
  system?: boolean;
  created: string;
  modified: string;
}

export interface Principal {
  uuid?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_org_admin: boolean;
  external_source_id?: number;
}

export interface Access {
  permission: string;
  resourceDefinitions?: any[];
}

export interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description: string;
  system: boolean;
  platform_default?: boolean;
  admin_default?: boolean;
  created: string;
  modified: string;
  policyCount?: number;
  accessCount?: number;
  applications?: string[];
  access?: Access[];
  groups_in?: Array<{ uuid: string; name: string; description: string }>;
  groups_in_count?: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  type: 'root' | 'standard';
  created: string;
  updated: string;
}

export interface ServiceAccount {
  clientId: string;
  name: string;
  description: string;
  owner: string;
  username: string;
  time_created: number;
  type: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
}
