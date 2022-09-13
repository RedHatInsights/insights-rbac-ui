import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import { mountToJson } from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupRoles from '../../../../smart-components/group/role/group-roles';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { rolesInitialState } from '../../../../redux/reducers/role-reducer';
import { groupsInitialState } from '../../../../redux/reducers/group-reducer';

import * as GroupActions from '../../../../redux/actions/group-actions';
import { FETCH_ROLES_FOR_GROUP, FETCH_SYSTEM_GROUP } from '../../../../redux/action-types';

jest.mock('../../../../redux/actions/group-actions', () => {
  const actual = jest.requireActual('../../../../redux/actions/group-actions');
  return {
    __esModule: true,
    ...actual,
  };
});

describe('<GroupPrincipals />', () => {
  let initialProps;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let emptyState;
  let initialState;

  const fetchSystemGroupSpy = jest.spyOn(GroupActions, 'fetchSystemGroup');
  const fetchRolesForGroupSpy = jest.spyOn(GroupActions, 'fetchRolesForGroup');
  const fetchMembersForGroupSpy = jest.spyOn(GroupActions, 'fetchMembersForGroup');
  const fetchAddRolesForGroupSpy = jest.spyOn(GroupActions, 'fetchAddRolesForGroup');

  beforeEach(() => {
    fetchSystemGroupSpy.mockImplementation(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementation(() => ({ type: FETCH_ROLES_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchRolesForGroupSpy.mockImplementation(() => ({ type: FETCH_ROLES_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchAddRolesForGroupSpy.mockImplementation(() => ({ type: FETCH_ROLES_FOR_GROUP, payload: Promise.resolve({}) }));

    initialProps = {};
    mockStore = configureStore(middlewares);
    (emptyState = {
      roleReducer: {
        ...rolesInitialState,
      },
      groupReducer: {
        ...groupsInitialState,
      },
    }),
      (initialState = {
        roleReducer: {
          ...rolesInitialState,
          isLoading: false,
          roles: [],
        },
        groupReducer: {
          ...groupsInitialState,
          isLoading: false,
          groups: {
            identity: {
              user: {
                is_org_admin: true,
              },
            },
          },
          systemGroup: {
            uuid: '123',
            name: 'Test group',
            description: 'Description',
            platform_default: true,
            roleCount: 11,
            roles: [
              {
                uuid: '123',
                name: 'User role',
                description: 'Description',
                modified: '2020-03-31T19:06:06.682885Z',
                system: true,
                platform_default: true,
              },
            ],
          },
          selectedGroup: {
            addRoles: {
              roles: [],
              pagination: {
                count: 1,
                limit: 10,
                offset: 0,
              },
            },
            uuid: '123',
            name: 'Test group',
            description: 'Description',
            platform_default: true,
            roleCount: 11,
            roles: [
              {
                uuid: '123',
                name: 'User role',
                description: 'Description',
                modified: '2020-03-31T19:06:06.682885Z',
                system: true,
                platform_default: true,
              },
            ],
          },
        },
      });
  });

  afterEach(() => {
    fetchSystemGroupSpy.mockReset();
    fetchRolesForGroupSpy.mockReset();
    fetchMembersForGroupSpy.mockReset();
    fetchAddRolesForGroupSpy.mockReset();
  });

  it('should render empty correctly', async () => {
    const store = mockStore(emptyState);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123/roles']} initialIndex={0}>
            <Route path="/groups/detail/:uuid/roles" component={GroupRoles} {...initialProps} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('.pf-c-toolbar button[disabled=false].pf-m-primary')).toHaveLength(0);
    expect(mountToJson(wrapper.find('TableToolbarViewOld'), { mode: 'mount' })).toMatchSnapshot();
  });

  it('should fetch group roles on mount', async () => {
    const store = mockStore(initialState);
    await act(async () => {
      mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123/roles']} initialIndex={0}>
            <Route path="/groups/detail/:uuid/roles" component={GroupRoles} {...initialProps} />
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedPayload = [
      {
        type: 'FETCH_SYSTEM_GROUP_PENDING',
      },
      {
        type: 'FETCH_ROLES_FOR_GROUP_PENDING',
      },
      {
        type: 'FETCH_SYSTEM_GROUP_PENDING',
      },
      {
        type: 'FETCH_ROLES_FOR_GROUP_PENDING',
      },
      {
        payload: {},
        type: 'FETCH_SYSTEM_GROUP_FULFILLED',
      },
      {
        payload: {},
        type: 'FETCH_ROLES_FOR_GROUP_FULFILLED',
      },
      {
        payload: {},
        type: 'FETCH_SYSTEM_GROUP_FULFILLED',
      },
      {
        payload: {},
        type: 'FETCH_ROLES_FOR_GROUP_FULFILLED',
      },
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
