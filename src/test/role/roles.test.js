import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import Roles from '../../features/roles/roles';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { rolesInitialState } from '../../redux/roles/reducer';
import PermissionsContext from '../../utilities/permissionsContext';

import * as RoleActions from '../../redux/roles/actions';
import * as GroupActions from '../../redux/groups/actions';
import { FETCH_ROLES } from '../../redux/roles/action-types';
import { FETCH_ADMIN_GROUP } from '../../redux/groups/action-types';
import { defaultSettings } from '../../helpers/pagination';

describe('<Roles />', () => {
  const middlewares = [promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;
  const adminPermissions = {
    orgAdmin: true,
    userAccessAdministrator: false,
  };

  const fetchRolesWithPoliciesSpy = jest.spyOn(RoleActions, 'fetchRolesWithPolicies');
  const fetchAdminGroupSpy = jest.spyOn(GroupActions, 'fetchAdminGroup');
  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = {
      roleReducer: {
        ...rolesInitialState,
        roles: {
          identity: {
            user: {},
          },
          data: [
            {
              name: 'Test name',
              uuid: 'test',
              description: 'test',
              system: false,
              accessCount: 1,
              groups_in_count: 1,
              groups_in: [
                {
                  name: 'Test Redirect',
                  uuid: 'abc',
                  description: null,
                },
              ],
              access: [
                {
                  resourceDefinitions: [],
                  permission: 'advisor:*:*',
                },
              ],
              modified: new Date(0),
            },
          ],
          filters: {},
          pagination: defaultSettings,
          meta: defaultSettings,
        },
        isLoading: false,
      },
      groupReducer: {
        adminGroup: {},
      },
    };
  });

  afterEach(() => {
    fetchRolesWithPoliciesSpy.mockReset();
    fetchAdminGroupSpy.mockReset();
  });

  it('should render correctly', async () => {
    const store = mockStore(initialState);
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider store={store}>
          <PermissionsContext.Provider value={adminPermissions}>
            <MemoryRouter initialEntries={['/roles']}>
              <Roles />
            </MemoryRouter>
          </PermissionsContext.Provider>
        </Provider>,
      );
      container = ci;
    });

    await act(async () => {
      await fireEvent.click(container.querySelector('#expandable-toggle-0-3'));
    });

    await act(async () => {
      await fireEvent.click(container.querySelector('#expandable-toggle-0-3'));
    });
    expect(container.querySelector('#tab-roles')).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      ...initialState,
      roleReducer: {
        ...initialState.roleReducer,
        isLoading: true,
      },
    });
    render(
      <Provider store={store}>
        <PermissionsContext.Provider value={adminPermissions}>
          <MemoryRouter initialEntries={['/roles']}>
            <Roles />
          </MemoryRouter>
        </PermissionsContext.Provider>
      </Provider>,
    );
    expect(screen.getByLabelText('Loading')).toMatchSnapshot();
  });

  it('should render correctly in org admin', () => {
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      ...initialState,
      roleReducer: {
        ...initialState.roleReducer,
        roles: {
          ...initialState.roleReducer.roles,
          identity: {
            user: { is_org_admin: true },
          },
        },
      },
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/roles']}>
          <Roles />
        </MemoryRouter>
      </Provider>,
    );
    expect(container.querySelector('section')).toMatchSnapshot();
  });

  it('should fetch roles on sort click', async () => {
    const store = mockStore(initialState);
    fetchRolesWithPoliciesSpy
      .mockImplementation(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }))
      .mockImplementation(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={store}>
          <PermissionsContext.Provider value={adminPermissions}>
            <MemoryRouter initialEntries={['/roles']}>
              <Roles />
            </MemoryRouter>
          </PermissionsContext.Provider>
        </Provider>,
      );
    });
    store.clearActions();
    await act(async () => {
      await fireEvent.click(screen.getByText('Name'));
    });
    expect(fetchRolesWithPoliciesSpy).toHaveBeenCalledTimes(2);
    expect(fetchRolesWithPoliciesSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filters: {
          display_name: undefined,
        },
        orderBy: 'display_name',
        usesMetaInURL: true,
        limit: 20,
        offset: 0,
      }),
    );
    expect(fetchRolesWithPoliciesSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        filters: {
          display_name: undefined,
        },
        orderBy: '-display_name',
        usesMetaInURL: true,
        limit: 20,
      }),
    );
  });

  it('should render correctly expanded', async () => {
    const store = mockStore(initialState);
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider store={store}>
          <PermissionsContext.Provider value={adminPermissions}>
            <MemoryRouter initialEntries={['/roles']}>
              <Roles />
            </MemoryRouter>
          </PermissionsContext.Provider>
        </Provider>,
      );

      container = ci;
    });

    // Find the first expandable toggle button for groups (if it exists)
    const groupsToggle = container.querySelector('[id*="expandable-toggle"][id*="-3"]');
    if (groupsToggle) {
      await act(async () => {
        await fireEvent.click(groupsToggle);
      });
    }

    // Find the first expandable toggle button for access/permissions (if it exists)
    const accessToggle = container.querySelector('[id*="expandable-toggle"][id*="-2"]');
    if (accessToggle) {
      await act(async () => {
        await fireEvent.click(accessToggle);
      });
    }

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('table')).toMatchSnapshot();
  });
});
