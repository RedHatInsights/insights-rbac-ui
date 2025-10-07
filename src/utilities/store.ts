import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { notificationsReducer } from '@redhat-cloud-services/frontend-components-notifications/redux';
import ReducerRegistry, { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { createContext } from 'react';
import { compose } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import thunk from 'redux-thunk';
import accessReducer, { accessInitialState } from '../redux/access-management/reducer';
import costReducer, { costInitialState } from '../redux/cost-management/reducer';
import errorReducer from '../redux/api-error/error-reducer';
import groupReducer, { groupsInitialState } from '../redux/groups/reducer';
import inventoryReducer, { inventoryGroupsInitialState } from '../redux/inventory/reducer';
import permissionReducer, { permissionInitialState } from '../redux/permissions/reducer';
import policyReducer, { policiesInitialState } from '../redux/policies/reducer';
import roleReducer, { rolesInitialState } from '../redux/roles/reducer';
import serviceAccountReducer, { serviceAccountsInitialState } from '../redux/service-accounts/reducer';
import userReducer, { usersInitialState } from '../redux/users/reducer';
import workspacesReducer, { workspacesInitialState } from '../redux/workspaces/reducer';

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

const composeEnhancers =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof window === 'object' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.location.hostname.includes('.foo.redhat.com')
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;

export function registryFactory() {
  const registry = new ReducerRegistry({}, middlewares, composeEnhancers);

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

  return registry;
}

// Singleton registry instance used by all code
let registry = registryFactory();

// Function to replace the module's registry with a fresh instance
// This is used by Storybook to get fresh state on each story replay
export function resetRegistry() {
  registry = registryFactory();
  return registry;
}

// Getter function that always returns the current registry
export function getRegistry() {
  return registry;
}

export default registry;
