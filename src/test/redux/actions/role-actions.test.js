import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { fetchRoleDetails, fetchRoles } from '../../../redux/actions/role-actions';
import { FETCH_ROLES, FETCH_ROLE_DETAILS } from '../../../redux/action-types';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as RoleHelper from '../../../helpers/role/role-helper';
import { BAD_UUID } from '../../../helpers/shared/helpers';

describe('role actions', () => {
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const fetchRolesSpy = jest.spyOn(RoleHelper, 'fetchRoles');
  const fetchRoleDetailsSpy = jest.spyOn(RoleHelper, 'fetchRole');
  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchRolesSpy.mockReset();
    fetchRoleDetailsSpy.mockReset();
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

  it('should dispatch correct actions after fetching role details', async () => {
    const store = mockStore({});
    fetchRoleDetailsSpy.mockResolvedValueOnce({
      data: [{ name: 'roleName', uuid: '1234', access: [] }],
    });
    const expectedActions = [
      {
        type: `${FETCH_ROLE_DETAILS}_PENDING`,
        meta: { uuid: '1234' },
      },
      {
        meta: { uuid: '1234' },
        payload: { data: [{ name: 'roleName', uuid: '1234', access: [] }] },
        type: `${FETCH_ROLE_DETAILS}_FULFILLED`,
      },
    ];

    await store.dispatch(fetchRoleDetails('1234'));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should dispatch correct actions after fetching role fails', async () => {
    const store = mockStore({});
    fetchRoleDetailsSpy.mockRejectedValueOnce({ errors: [{ status: '400', source: 'role uuid validation' }] });
    const expectedActions = [
      {
        type: `${FETCH_ROLE_DETAILS}_PENDING`,
        meta: { uuid: '1234' },
      },
      {
        meta: { uuid: '1234' },
        payload: { error: BAD_UUID },
        type: `${FETCH_ROLE_DETAILS}_FULFILLED`,
      },
    ];

    await store.dispatch(fetchRoleDetails('1234'));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
