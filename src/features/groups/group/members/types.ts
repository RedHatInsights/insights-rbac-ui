import React from 'react';
import { Member } from '../../../../redux/groups/reducer';

// Re-export Member from Redux for convenience
export type { Member };

export interface MemberTableRow {
  id: string;
  row: React.ReactNode[];
  member: Member;
}

export interface MembersPagination {
  limit: number;
  offset: number;
  count: number;
}

export interface SortByState {
  index: number;
  direction: 'asc' | 'desc';
}

export interface GroupMembersFilters {
  name?: string;
}
