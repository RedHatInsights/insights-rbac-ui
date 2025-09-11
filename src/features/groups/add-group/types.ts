// Types for add-group functionality
export interface User {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  uuid?: string;
}

export interface UserFilters {
  username?: string;
  email?: string;
  status?: string[];
}

export interface UsersListProps {
  selectedUsers: User[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>;
  userLinks?: boolean;
  usesMetaInURL?: boolean;
  displayNarrow?: boolean;
}
