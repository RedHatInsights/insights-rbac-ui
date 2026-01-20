// Re-export ServiceAccount from the single source of truth
export type { ServiceAccount } from '../../../../data/queries/groups';

export interface ServiceAccountFilters {
  clientId: string;
  name: string;
  description: string;
}

export interface ServiceAccountTableRow {
  id: string;
  row: React.ReactNode[];
  item: import('../../../../data/queries/groups').ServiceAccount;
}

export interface GroupServiceAccountsProps {
  groupId?: string;
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}
