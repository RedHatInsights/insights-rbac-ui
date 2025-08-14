import React from 'react';

export interface Member {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
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
