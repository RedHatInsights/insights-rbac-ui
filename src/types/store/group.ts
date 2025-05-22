export {};
declare global {
  interface Group {
    uuid: string;
    name: string;
    description?: string;
    principalCount?: number;
    roleCount?: number;
    created?: string;
    modified?: string;
    admin_default?: boolean;
    platform_default?: boolean;
    system?: boolean;
  }

  interface GroupStore {
    groups: {
      data: Group[];
      meta: any;
      filters: any;
      pagination: { count: number };
    };
    selectedGroup: Group & {
      addRoles: any;
      members: { meta: PaginationDefaultI; data?: any[] };
      serviceAccounts: { meta: PaginationDefaultI; data?: any[] };
      pagination: PaginationDefaultI;
      roles?: { data: any[]; isLoading: boolean };
      loaded?: boolean;
      error?: any;
    };
    isLoading: boolean;
    isRecordLoading: boolean;
    adminGroup?: Group;
    systemGroup?: Group;
    isSystemGroupLoading?: boolean;
  }
}
