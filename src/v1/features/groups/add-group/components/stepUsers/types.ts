// Types for add-group functionality
export interface User {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
  uuid?: string;
}

export interface UserFilters {
  username?: string;
  email?: string;
  status?: string[];
}

export interface UsersListProps {
  initialSelectedUsers: User[];
  onSelect: (selectedUsers: User[]) => void; // Consumers handle selection changes
  userLinks?: boolean;
  usesMetaInURL?: boolean;
  displayNarrow?: boolean;
}
