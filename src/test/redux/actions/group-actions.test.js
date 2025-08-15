import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import { fetchAdminGroup, fetchGroup, fetchGroups, fetchSystemGroup } from '../../../redux/actions/group-actions';
import { FETCH_ADMIN_GROUP, FETCH_GROUP, FETCH_GROUPS, FETCH_SYSTEM_GROUP } from '../../../redux/action-types';

import * as GroupHelper from '../../../helpers/group/group-helper';

const createActionResult = (type, payload, meta) => [{ type: `${type}_PENDING` }, { type: `${type}_FULFILLED`, payload, meta }];

describe('group actions', () => {
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const fetchGroupsSpy = jest.spyOn(GroupHelper, 'fetchGroups');
  const fetchGroupSpy = jest.spyOn(GroupHelper, 'fetchGroup');

  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchGroupsSpy.mockReset();
    fetchGroupSpy.mockReset();
  });

  it('should dispatch correct actions after fetching groups', async () => {
    const store = mockStore({});
    const expectedActions = createActionResult(FETCH_GROUPS, {
      data: [{ name: 'groupName', uuid: '1234', members: undefined }],
    });

    fetchGroupsSpy.mockResolvedValueOnce({ data: [{ name: 'groupName', uuid: '1234' }] });
    await store.dispatch(fetchGroups());
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should dispatch correct actions after fetching admin group', async () => {
    const store = mockStore({});
    const expectedActions = createActionResult(FETCH_ADMIN_GROUP, {
      data: [{ name: 'admin-group', uuid: 'admin-group', members: undefined }],
    });

    fetchGroupsSpy.mockResolvedValueOnce({ data: [{ name: 'admin-group', uuid: 'admin-group' }] });
    await store.dispatch(fetchAdminGroup());
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should dispatch correct actions after fetching system group', async () => {
    const store = mockStore({});
    const expectedActions = createActionResult(FETCH_SYSTEM_GROUP, {
      data: [{ name: 'system-group', uuid: 'system-group', members: undefined }],
    });

    fetchGroupsSpy.mockResolvedValueOnce({ data: [{ name: 'system-group', uuid: 'system-group' }] });
    await store.dispatch(fetchSystemGroup());
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should dispatch correct actions after fetching group', async () => {
    const store = mockStore({});
    const expectedActions = createActionResult(FETCH_GROUP, { name: 'group', uuid: 'group' });

    fetchGroupSpy.mockResolvedValueOnce({ name: 'group', uuid: 'group' });
    await store.dispatch(fetchGroup());
    expect(store.getActions()).toEqual(expectedActions);
  });
});
