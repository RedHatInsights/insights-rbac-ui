import { createContext } from 'react';
import promiseMiddleware from 'redux-promise-middleware';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { notificationsReducer } from '@redhat-cloud-services/frontend-components-notifications/redux';
import ReducerRegistry, { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import reduxLogger from 'redux-logger';
import thunk from 'redux-thunk';
import userReducer, { usersInitialState } from '../redux/reducers/user-reducer';
import groupReducer, { groupsInitialState } from '../redux/reducers/group-reducer';
import policyReducer, { policiesInitialState } from '../redux/reducers/policy-reducer';
import roleReducer, { rolesInitialState } from '../redux/reducers/role-reducer';
import accessReducer, { accessInitialState } from '../redux/reducers/access-reducer';
import permissionReducer, { permissionInitialState } from '../redux/reducers/permission-reducer';
import costReducer, { costInitialState } from '../redux/reducers/cost-reducer';
import errorReducer from '../redux/reducers/errorReducer';
import experimentalGroupsReducer, { experimentalGroupsReducerInitialState } from '../redux/experimental/groups-reducer';

export const RegistryContext = createContext({
  getRegistry: () => {},
});

const constructFetchAction = (prevAction) => ({
  type: prevAction.type,
  payload: prevAction.req(),
  meta: {
    ...prevAction.meta,
    query: prevAction?.meta?.query,
  },
});

const experimentalInvalidationMiddleware = (store) => (next) => (action) => {
  /**
   * Check cache for data
   */
  if (action.prefferCache && action.req) {
    const ts = Date.now();
    const query = action?.meta?.query;
    const state = store.getState()[action.reducer]?.storage;
    /**
     * get data list from cache
     */
    if (state && action.reqType === 'list') {
      const page = state.pages[query];
      if (typeof page !== 'undefined' && page.expiration >= ts) {
        const newAction = {
          type: `${action.type}_SET`,
          payload: query,
          meta: {
            query,
          },
        };

        return next(newAction);
        /**
         * Data is expired or not in cache
         */
      } else if (!page || (state && page.expiration < ts)) {
        return next(constructFetchAction(action));
      }
    } else if (state && action.reqType === 'entity') {
      const entity = state.entities[action?.meta?.entityId];
      const newAction = entity
        ? {
            type: `${action.type}_SET`,
            payload: action?.meta?.entityId,
          }
        : constructFetchAction(action);
      return next(newAction);
    }
    /**
     * Bypass cache
     */
  } else if (!action.prefferCache && action.req) {
    return next(constructFetchAction(action));
  }
  /**
   * Ignore action and pass it allong
   */
  return next(action);
};

const registry = new ReducerRegistry({}, [
  thunk,
  experimentalInvalidationMiddleware,
  promiseMiddleware,
  notificationsMiddleware({
    errorTitleKey: ['statusText', 'message', 'errors[0].status'],
    errorDescriptionKey: ['errors[0].detail', 'errors', 'stack'],
  }),
  reduxLogger,
]);

registry.register({
  userReducer: applyReducerHash(userReducer, usersInitialState),
  groupReducer: applyReducerHash(groupReducer, groupsInitialState),
  policyReducer: applyReducerHash(policyReducer, policiesInitialState),
  roleReducer: applyReducerHash(roleReducer, rolesInitialState),
  accessReducer: applyReducerHash(accessReducer, accessInitialState),
  permissionReducer: applyReducerHash(permissionReducer, permissionInitialState),
  costReducer: applyReducerHash(costReducer, costInitialState),
  errorReducer: applyReducerHash(errorReducer),
  notifications: notificationsReducer,
  experimentalGroupsReducer: applyReducerHash(experimentalGroupsReducer, experimentalGroupsReducerInitialState),
});

export default registry;
