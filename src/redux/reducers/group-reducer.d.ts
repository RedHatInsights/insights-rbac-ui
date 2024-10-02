import { PaginationDefaultI } from "../../helpers/shared/pagination";

export interface Group {
  uuid: string;
  name: string;
  description?: string;
  principalCount?: number;
  roleCount?: number;
  created?: string;
  modified?: string;
  admin_default?: boolean;
  platform_default?: boolean;
}

export interface GroupsState {
  groups: {
    data: Group[];
    meta: any;
    filters: any;
    pagination: { count: number };
  };
  selectedGroup: {
    addRoles: any;
    members: { meta: PaginationDefaultI; data?: any[] };
    serviceAccounts: { meta: PaginationDefaultI; data?: any[] };
    pagination: PaginationDefaultI;
    roles?: { data: any[]; isLoading: boolean };
    loaded?: boolean;
    error?: any;
  };
  isLoading: boolean;
  isRecordLoading: boolean;
  adminGroup?: Group;
  systemGroup?: Group;
  isSystemGroupLoading?: boolean;
}

export interface GroupAction {
  type: string;
  payload?: any;
  meta?: any;
}

declare const groupReducer: (state: GroupsState, action: GroupAction) => GroupsState;

export default groupReducer;
