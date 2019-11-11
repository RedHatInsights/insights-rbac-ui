import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store' ;
import promiseMiddleware from 'redux-promise-middleware';
import { mock } from '../../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../../utilities/constants';
import { fetchGroupPolicies } from '../../../redux/actions/policy-actions';
import { FETCH_GROUP_POLICIES } from '../../../redux/action-types';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

describe('policy actions', () => {

  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  it('should dispatch correct actions after fetching policies', () => {
    const store = mockStore({});
    const expectedActions = [{
      type: `${FETCH_GROUP_POLICIES}_PENDING`
    }, {
      payload: {
        data: [{
          name: 'policyName',
          uuid: '1234'
        }]},
      type: `${FETCH_GROUP_POLICIES}_FULFILLED`
    }];

    mock.onGet(`${RBAC_API_BASE}/policies/`).reply(200, {
      data: [{
        name: 'policyName',
        uuid: '1234'
      }]
    });

    mock.onGet(`${RBAC_API_BASE}/policies/1234/`).reply(200, {
      data: [{
        name: 'policyName',
        uuid: '1234'
      }]
    });

    return store.dispatch(fetchGroupPolicies('1234')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});

