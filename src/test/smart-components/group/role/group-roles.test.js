import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import { mountToJson } from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupRoles from '../../../../smart-components/group/role/group-roles';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { rolesInitialState } from '../../../../redux/reducers/role-reducer';
import { groupsInitialState } from '../../../../redux/reducers/group-reducer';

describe('<GroupPrincipals />', () => {
  let initialProps;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let emptyState;
  let initialState;

  beforeEach(() => {
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

  it('should render empty correctly', () => {
    const store = mockStore(emptyState);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123/roles']} initialIndex={0}>
          <Route path="/groups/detail/:uuid/roles" component={GroupRoles} {...initialProps} />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find('.pf-c-toolbar button[disabled=false].pf-m-primary')).toHaveLength(0);
    expect(mountToJson(wrapper.find('TableToolbarView'), { mode: 'mount' })).toMatchSnapshot();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123/roles']} initialIndex={0}>
          <Route path="/groups/detail/:uuid/roles" component={GroupRoles} {...initialProps} />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find('.pf-c-toolbar button[disabled=false].pf-m-primary')).toHaveLength(1);
    expect(mountToJson(wrapper.find('TableToolbarView'), { mode: 'mount' })).toMatchSnapshot();
  });

  it('should fetch group roles on mount', () => {
    const store = mockStore(initialState);
    mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123/roles']} initialIndex={0}>
          <Route path="/groups/detail/:uuid/roles" component={GroupRoles} {...initialProps} />
        </MemoryRouter>
      </Provider>
    );
    const expectedPayload = [{ type: 'FETCH_ROLES_FOR_GROUP_PENDING' }, { type: 'FETCH_ADD_ROLES_FOR_GROUP_PENDING' }];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
