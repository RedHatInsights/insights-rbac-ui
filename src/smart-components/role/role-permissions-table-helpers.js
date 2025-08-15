import React, { Fragment } from 'react';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import AppLink from '../../presentational-components/shared/AppLink';
import { getDateFormat } from '../../helpers/shared/helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import flatten from 'lodash/flatten';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

export const createRows = (showResDefinitions, uuid, data, intl, selectedRows = []) =>
  data.reduce((acc, { resourceDefinitions, permission, modified }) => {
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

export const rolePermissionsReducerInitialState = {
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
const reducerHandlers = {
  [SET_PAGINATION]: (state, pagination) => ({ ...state, pagination: { ...state.pagination, ...pagination } }),
  [SELECT_PERMISSIONS]: (state, { selection }) => ({ ...state, selectedPermissions: selection }),
  [SHOW_REMOVE_MODAL]: (state, { showRemoveModal }) => ({ ...state, showRemoveModal }),
  [SUBMIT_REMOVE_MODAL]: (state) => ({ ...state, selectedPermissions: [], showRemoveModal: false }),
  [INITIATE_REMOVE_PERMISSION]: (state, { confirmDelete, deleteInfo }) => ({ ...state, confirmDelete, showRemoveModal: true, deleteInfo }),
  [SET_FILTERS]: (state, filters) => ({ ...state, filters: { ...state.filters, ...filters } }),
  [SET_TOGGLED]: (state) => ({ ...state, isToggled: !state.isToggled }),
  [INITIALIZE_ROLE]: (state, { count, ...options }) => ({ ...state, ...options, pagination: { ...state.pagination, count } }),
};
export const rolePermissionsReducer = (state, { type, ...action }) => {
  if (!reducerHandlers[type]) {
    return state;
  }

  return reducerHandlers[type](state, action);
};
