// Re-export types from Redux to ensure consistency
export type { ServiceAccount } from '../../../../redux/groups/reducer';

export interface ServiceAccountFilters {
  clientId: string;
  name: string;
  description: string;
}

import type { ServiceAccount } from '../../../../redux/groups/reducer';

export interface ServiceAccountTableRow {
  id: string;
  row: React.ReactNode[];
  item: ServiceAccount;
}

export interface GroupServiceAccountsProps {
  groupId?: string;
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}
