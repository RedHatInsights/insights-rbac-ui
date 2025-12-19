import React, { Fragment } from 'react';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { AppLink } from '../../../../components/navigation/AppLink';
import { getDateFormat } from '../../../../helpers/stringUtilities';
import { defaultSettings } from '../../../../helpers/pagination';
import flatten from 'lodash/flatten';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { IntlShape } from 'react-intl';

interface ResourceDefinition {
  attributeFilter: {
    value: unknown[];
  };
}

interface PermissionData {
  resourceDefinitions?: ResourceDefinition[];
  permission: string;
  modified: string;
}

interface SelectedRow {
  uuid: string;
}

interface Row {
  uuid: string;
  cells: React.ReactNode[];
  selected: boolean;
}

export const createRows = (
  showResDefinitions: boolean,
  uuid: string,
  data: PermissionData[],
  intl: IntlShape,
  selectedRows: SelectedRow[] = [],
): Row[] =>
  data.reduce((acc: Row[], { resourceDefinitions = [], permission, modified }) => {
    const [appName, type, operation] = permission.split(':');
    return [
      ...acc,
      {
        uuid: permission,
        cells: [
          appName,
          type,
          operation,
          ...(showResDefinitions
            ? [
                (permission.includes('cost-management') || permission.includes('inventory')) && resourceDefinitions.length > 0 ? (
                  <Fragment key="resource-definitions">
                    <AppLink to={pathnames['role-detail-permission'].link.replace(':roleId', uuid).replace(':permissionId', permission)}>
                      {flatten(resourceDefinitions.map((definition) => definition.attributeFilter.value)).length}
                    </AppLink>
                  </Fragment>
                ) : (
                  <span className="rbac-c-text__disabled">{intl.formatMessage(messages.notApplicable)}</span>
                ),
              ]
            : []),
          <Fragment key={`${appName}-modified`}>
            <DateFormat date={modified} type={getDateFormat(modified)} />
          </Fragment>,
        ],
        selected: Boolean(selectedRows?.find(({ uuid }) => uuid === permission)),
      },
    ];
  }, []);

interface FilterOption {
  label: string;
  value: string;
}

interface Pagination {
  limit?: number;
  offset?: number;
  count?: number;
}

interface DeleteInfo {
  title?: string;
  text?: React.ReactNode;
  confirmButtonLabel?: string;
}

export interface RolePermissionsState {
  pagination: Pagination;
  selectedPermissions: SelectedRow[];
  showRemoveModal: boolean;
  confirmDelete: () => void;
  deleteInfo: DeleteInfo;
  filters: {
    applications: string[];
    resources: string[];
    operations: string[];
  };
  isToggled: boolean;
  resources: FilterOption[];
  operations: FilterOption[];
}

export const rolePermissionsReducerInitialState: RolePermissionsState = {
  pagination: defaultSettings,
  selectedPermissions: [],
  showRemoveModal: false,
  confirmDelete: () => null,
  deleteInfo: {},
  filters: {
    applications: [],
    resources: [],
    operations: [],
  },
  isToggled: false,
  resources: [],
  operations: [],
};

export const SET_PAGINATION = 'SET_PAGINATION';
export const SELECT_PERMISSIONS = 'SELECT_PERMISSIONS';
export const SHOW_REMOVE_MODAL = 'SHOW_REMOVE_MODAL';
export const SUBMIT_REMOVE_MODAL = 'SUBMIT_REMOVE_MODAL';
export const INITIATE_REMOVE_PERMISSION = 'INITIATE_REMOVE_PERMISSION';
export const SET_FILTERS = 'SET_FILTERS';
export const SET_TOGGLED = 'SET_TOGGLED';
export const SET_FILTER_OPTIONS = 'SET_FILTER_OPTIONS';
export const INITIALIZE_ROLE = 'INITIALIZE_ROLE';

type ActionType =
  | typeof SET_PAGINATION
  | typeof SELECT_PERMISSIONS
  | typeof SHOW_REMOVE_MODAL
  | typeof SUBMIT_REMOVE_MODAL
  | typeof INITIATE_REMOVE_PERMISSION
  | typeof SET_FILTERS
  | typeof SET_TOGGLED
  | typeof SET_FILTER_OPTIONS
  | typeof INITIALIZE_ROLE;

interface Action {
  type: ActionType;
  [key: string]: unknown;
}

const reducerHandlers: Record<string, (state: RolePermissionsState, action: Record<string, unknown>) => RolePermissionsState> = {
  [SET_PAGINATION]: (state, pagination) => ({ ...state, pagination: { ...state.pagination, ...(pagination as Pagination) } }),
  [SELECT_PERMISSIONS]: (state, { selection }) => ({ ...state, selectedPermissions: selection as SelectedRow[] }),
  [SHOW_REMOVE_MODAL]: (state, { showRemoveModal }) => ({ ...state, showRemoveModal: showRemoveModal as boolean }),
  [SUBMIT_REMOVE_MODAL]: (state) => ({ ...state, selectedPermissions: [], showRemoveModal: false }),
  [INITIATE_REMOVE_PERMISSION]: (state, { confirmDelete, deleteInfo }) => ({
    ...state,
    confirmDelete: confirmDelete as () => void,
    showRemoveModal: true,
    deleteInfo: deleteInfo as DeleteInfo,
  }),
  [SET_FILTERS]: (state, filters) => ({ ...state, filters: { ...state.filters, ...(filters as RolePermissionsState['filters']) } }),
  [SET_TOGGLED]: (state) => ({ ...state, isToggled: !state.isToggled }),
  [INITIALIZE_ROLE]: (state, { count, ...options }) => ({
    ...state,
    ...(options as Partial<RolePermissionsState>),
    pagination: { ...state.pagination, count: count as number },
  }),
};

export const rolePermissionsReducer = (state: RolePermissionsState, { type, ...action }: Action): RolePermissionsState => {
  if (!reducerHandlers[type]) {
    return state;
  }

  return reducerHandlers[type](state, action);
};
