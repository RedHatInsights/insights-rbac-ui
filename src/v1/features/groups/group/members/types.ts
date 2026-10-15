import React from 'react';

// Member type - aligned with React Query
export interface Member {
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
}

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
