export {};
declare global {
  interface RoleGroup {
    description: string;
    name: string;
    uuid: string;
  }

  interface Access {
    resourceDefinition: any[];
    permission: string;
  }

  interface Role {
    description: string;
    name: string;
    display_name: string;
    uuid: string;
    created: string;
    modified: string;
    access: Access[];
    accessCount: number;
    admin_default: boolean;
    applications: string[];
    external_role_id: string;
    external_tenant: string;
    groups_in: RoleGroup[];
    groups_in_count: number;
    platform_default: boolean;
    policyCount: number;
    system: boolean;
  }

  interface RoleStore extends Record<string, unknown> {
    selectedRole: Record<string, unknown>;
    isLoading: boolean;
    isRecordLoading: boolean;
    roles: {
      meta: PaginationDefaultI;
      filters: any;
      pagination: PaginationDefaultI & { redirected?: boolean };
      data: Role[];
    };
    rolesForWizard: {
      data: Role[];
      meta: PaginationDefaultI;
    };
  }
}
