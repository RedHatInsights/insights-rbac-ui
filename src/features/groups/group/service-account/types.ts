import type { ReactNode } from 'react';
import type { ServiceAccount } from '../../../../data/queries/groups';

// Re-export ServiceAccount for external consumers
export type { ServiceAccount };

export interface ServiceAccountFilters {
  clientId: string;
  name: string;
  description: string;
}

export interface ServiceAccountTableRow {
  id: string;
  row: ReactNode[];
  item: ServiceAccount;
}

export interface GroupServiceAccountsProps {
  groupId?: string;
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}
