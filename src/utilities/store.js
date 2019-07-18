
import promiseMiddleware from 'redux-promise-middleware';
import ReducerRegistry, { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';
import { notifications, notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import reduxLogger from 'redux-logger';
import thunk from 'redux-thunk';
import userReducer, { usersInitialState } from '../redux/reducers/user-reducer';
import groupReducer, { groupsInitialState } from '../redux/reducers/group-reducer';
import policyReducer, { policiesInitialState } from '../redux/reducers/policy-reducer';
import roleReducer, { rolesInitialState } from '../redux/reducers/role-reducer';

const registry = new ReducerRegistry({}, [ thunk, promiseMiddleware(), notificationsMiddleware({
  errorTitleKey: [ 'message' ],
  errorDescriptionKey: [ 'errors', 'stack' ]
}), reduxLogger ]);

registry.register({
  userReducer: applyReducerHash(userReducer, usersInitialState),
  groupReducer: applyReducerHash(groupReducer, groupsInitialState),
  policyReducer: applyReducerHash(policyReducer, policiesInitialState),
  roleReducer: applyReducerHash(roleReducer, rolesInitialState),
  notifications
});

export default registry.getStore();
