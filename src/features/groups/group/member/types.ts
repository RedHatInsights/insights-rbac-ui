// Types for add group members functionality
export interface User {
  label: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface AddGroupMembersProps {
  cancelRoute: string;
}
