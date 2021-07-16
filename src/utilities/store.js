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

export const RegistryContext = createContext({
  getRegistry: () => {},
});

const registry = new ReducerRegistry({}, [
  thunk,
  promiseMiddleware,
  notificationsMiddleware({
    errorTitleKey: ['message'],
    errorDescriptionKey: ['errors', 'stack'],
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
  notifications: notificationsReducer,
});

export default registry;
