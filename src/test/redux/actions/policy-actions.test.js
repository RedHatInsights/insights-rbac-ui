import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store' ;
import promiseMiddleware from 'redux-promise-middleware';
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

    apiClientMock.get(`${RBAC_API_BASE}/policies/`, mockOnce({
      body: {
        data: [{
          name: 'policyName',
          uuid: '1234'
        }]
      }
    }));

    apiClientMock.get(`${RBAC_API_BASE}/policies/1234/`, mockOnce({
      body: {
        data: {
          name: 'policyName',
          uuid: '1234'
        }
      }
    }));
    return store.dispatch(fetchGroupPolicies('1234')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});

