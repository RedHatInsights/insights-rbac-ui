export {};
declare global {
  interface User {
    email: string;
    external_source_id: string;
    first_name: string;
    is_active: boolean;
    is_org_admin: boolean;
    last_name: string;
    username: string;
    uuid?: string;
  }

  interface UserFilters {
    username?: string;
    email?: string;
    status?: ('enabled' | 'disabled' | 'all')[];
  }

  interface UserStore extends Record<string, unknown> {
    selectedUser: Record<string, unknown>;
    isUserDataLoading: boolean;
    users: {
      meta: PaginationDefaultI;
      filters: UserFilters;
      pagination: PaginationDefaultI & { redirected?: boolean };
      data?: User[];
    };
  }
}
