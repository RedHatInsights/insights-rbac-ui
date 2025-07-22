import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { fetchGroupPolicies } from '../../../redux/policies/actions';
import { FETCH_GROUP_POLICIES } from '../../../redux/policies/action-types';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as PolicyHelper from '../../../redux/policies/helper';

describe('policy actions', () => {
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const fetchGroupPoliciesSpy = jest.spyOn(PolicyHelper, 'fetchGroupPolicies');

  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchGroupPoliciesSpy.mockReset();
  });

  it('should dispatch correct actions after fetching policies', () => {
    const store = mockStore({});
    const expectedActions = [
      { type: `${FETCH_GROUP_POLICIES}_PENDING` },
      {
        payload: { data: [{ name: 'policyName', uuid: '1234' }] },
        type: `${FETCH_GROUP_POLICIES}_FULFILLED`,
      },
    ];

    fetchGroupPoliciesSpy.mockResolvedValueOnce({
      data: [
        {
          name: 'policyName',
          uuid: '1234',
        },
      ],
    });

    return store.dispatch(fetchGroupPolicies('1234')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
