// ServiceAccount type - aligned with React Query
export interface ServiceAccount {
  uuid: string; // Required for table row ID
  clientId: string;
  name: string;
  owner?: string;
  description?: string;
  time_created?: string;
}

export interface ServiceAccountFilters {
  clientId: string;
  name: string;
  description: string;
}

export interface ServiceAccountTableRow {
  id: string;
  row: React.ReactNode[];
  item: ServiceAccount;
}

export interface GroupServiceAccountsProps {
  groupId?: string;
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}
