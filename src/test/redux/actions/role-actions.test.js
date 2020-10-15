import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { FETCH_ROLES } from '../../../redux/action-types';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as RoleHelper from '../../../helpers/role/role-helper';

describe('role actions', () => {
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const fetchRolesSpy = jest.spyOn(RoleHelper, 'fetchRoles');
  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchRolesSpy.mockReset();
  });

  it('should dispatch correct actions after fetching roles', async () => {
    const store = mockStore({});
    fetchRolesSpy.mockResolvedValueOnce({
      data: [{ name: 'roleName', uuid: '1234' }],
    });
    const expectedActions = [
      {
        type: `${FETCH_ROLES}_PENDING`,
      },
      {
        payload: { data: [{ name: 'roleName', uuid: '1234' }] },
        type: `${FETCH_ROLES}_FULFILLED`,
      },
    ];

    await store.dispatch(fetchRoles());
    expect(store.getActions()).toEqual(expectedActions);
  });
});
