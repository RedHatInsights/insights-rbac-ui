// Types for add group members functionality
export interface User {
  label: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface Group {
  uuid: string;
  name: string;
}

export interface AddGroupMembersProps {
  cancelRoute: string;
  isDefault?: boolean;
  isChanged?: boolean;
  onDefaultGroupChanged?: (show: boolean) => void;
  fetchUuid?: string;
  groupName?: string;
  afterSubmit?: () => void;
}
