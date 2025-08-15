import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { fetchServiceAccounts } from '../../../redux/actions/service-account-actions';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as ServiceAccountsHelper from '../../../helpers/service-account/service-account-helper';
import { FETCH_SERVICE_ACCOUNTS } from '../../../redux/action-types';

describe('service accounts actions', () => {
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const fetchServiceAccountsSpy = jest.spyOn(ServiceAccountsHelper, 'getServiceAccounts');
  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchServiceAccountsSpy.mockReset();
  });

  it('should dispatch correct actions after fetching service accounts', async () => {
    const store = mockStore({});
    fetchServiceAccountsSpy.mockResolvedValueOnce({
      data: [
        {
          uuid: '123',
          createdAt: 1705616728000,
          assignedToSelectedGroup: false,
          clientId: '123',
          name: 'test1',
          createdBy: 'test',
        },
      ],
    });
    const expectedActions = [
      {
        type: `${FETCH_SERVICE_ACCOUNTS}_PENDING`,
      },
      {
        payload: {
          data: [
            {
              uuid: '123',
              createdAt: 1705616728000,
              assignedToSelectedGroup: false,
              clientId: '123',
              name: 'test1',
              createdBy: 'test',
            },
          ],
        },
        type: `${FETCH_SERVICE_ACCOUNTS}_FULFILLED`,
      },
    ];

    await store.dispatch(fetchServiceAccounts());
    expect(store.getActions()).toEqual(expectedActions);
  });
});
