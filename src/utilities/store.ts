import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { notificationsReducer } from '@redhat-cloud-services/frontend-components-notifications/redux';
import ReducerRegistry, { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { createContext } from 'react';
import promiseMiddleware from 'redux-promise-middleware';
import thunk from 'redux-thunk';
import accessReducer, { accessInitialState } from '../redux/reducers/access-reducer';
import costReducer, { costInitialState } from '../redux/reducers/cost-reducer';
import errorReducer from '../redux/reducers/errorReducer';
import groupReducer, { groupsInitialState } from '../redux/reducers/group-reducer';
import inventoryReducer, { inventoryGroupsInitialState } from '../redux/reducers/inventory-reducer';
import permissionReducer, { permissionInitialState } from '../redux/reducers/permission-reducer';
import policyReducer, { policiesInitialState } from '../redux/reducers/policy-reducer';
import roleReducer, { rolesInitialState } from '../redux/reducers/role-reducer';
import serviceAccountReducer, { serviceAccountsInitialState } from '../redux/reducers/service-account-reducer';
import userReducer, { usersInitialState } from '../redux/reducers/user-reducer';
import workspacesReducer, { workspacesInitialState } from '../redux/reducers/workspaces-reducer';

export const RegistryContext = createContext({
  getRegistry: () => {},
});

const middlewares = [
  thunk,
  promiseMiddleware,
  notificationsMiddleware({
    errorTitleKey: ['statusText', 'message', 'errors[0].status'],
    errorDescriptionKey: ['errors[0].detail', 'errors', 'stack'],
  }),
  // reduxLogger,
].filter((middleware) => typeof middleware === 'function');

const registry = new ReducerRegistry({}, middlewares);

registry.register({
  userReducer: applyReducerHash(userReducer, usersInitialState),
  workspacesReducer: applyReducerHash(workspacesReducer, workspacesInitialState),
  groupReducer: applyReducerHash(groupReducer, groupsInitialState),
  policyReducer: applyReducerHash(policyReducer, policiesInitialState),
  roleReducer: applyReducerHash(roleReducer, rolesInitialState),
  accessReducer: applyReducerHash(accessReducer, accessInitialState),
  permissionReducer: applyReducerHash(permissionReducer, permissionInitialState),
  inventoryReducer: applyReducerHash(inventoryReducer, inventoryGroupsInitialState),
  costReducer: applyReducerHash(costReducer, costInitialState),
  serviceAccountReducer: applyReducerHash(serviceAccountReducer, serviceAccountsInitialState),
  errorReducer: applyReducerHash(errorReducer),
  notifications: notificationsReducer,
});

export default registry;
