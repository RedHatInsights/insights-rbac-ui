import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import promiseMiddleware from 'redux-promise-middleware';
import { RoleLegacy as Role } from '../../features/roles/role/legacy/RoleLegacy';
import { FETCH_ROLE, UPDATE_ROLE } from '../../redux/roles/action-types';
import { FETCH_GROUP, FETCH_SYSTEM_GROUP } from '../../redux/groups/action-types';

import * as RoleActions from '../../redux/roles/actions';
import * as GroupActions from '../../redux/groups/actions';
import { getRoleApi } from '../../api/roleApi';
import { defaultSettings } from '../../helpers/pagination';
import { RemoveRoleModal } from '../../features/roles/RemoveRoleModal';
import * as useUserDataModule from '../../hooks/useUserData';

describe('role', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let initialState;

  const roleApi = getRoleApi();

  const fetchSystemGroupSpy = jest.spyOn(GroupActions, 'fetchSystemGroup');
  const fetchRoleSpy = jest.spyOn(RoleActions, 'fetchRole');
  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');
  const getRoleAccessSpy = jest.spyOn(roleApi, 'getRoleAccess');
  const updateRoleSpy = jest.spyOn(roleApi, 'updateRole');
  const removeRolePermissionsSpy = jest.spyOn(RoleActions, 'removeRolePermissions');

  // Mock useUserData to return orgAdmin permissions
  const useUserDataSpy = jest.spyOn(useUserDataModule, 'default');
  useUserDataSpy.mockReturnValue({ orgAdmin: true, userAccessAdministrator: false });

  removeRolePermissionsSpy.mockImplementation(() => ({ type: UPDATE_ROLE, payload: Promise.resolve({}) }));

  afterEach(() => {
    fetchSystemGroupSpy.mockReset();
    fetchRoleSpy.mockReset();
    fetchGroupSpy.mockReset();
    getRoleAccessSpy.mockReset();
    updateRoleSpy.mockReset();
    useUserDataSpy.mockReset();
  });

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        error: undefined,
      },
      roleReducer: {
        isRecordLoading: false,
        selectedRole: {
          uuid: '1234',
          display_name: 'name',
          description: 'description',
          system: false,
          access: [
            {
              resourceDefinitions: [
                {
                  attributeFilter: {
                    key: 'test.test.test',
                    value: 'test',
                    operation: 'equal',
                  },
                },
              ],
              permission: 'cost-management:*:read',
            },
          ],
        },
      },
      permissionReducer: {
        isLoading: false,
        options: {
          isLoadingApplication: false,
          isLoadingResource: false,
          isLoadingOperation: false,
          application: { data: [] },
          resource: { data: [] },
          operation: { data: [] },
        },
        permission: {
          data: [],
          meta: defaultSettings,
        },
        expandSplats: {
          data: [],
          meta: defaultSettings,
        },
      },
      costReducer: {
        isLoading: false,
        resourceTypes: {
          data: [],
          meta: defaultSettings,
        },
        resources: {},
        loadingResources: 0,
      },
    };

    // Re-apply useUserData mock after reset
    useUserDataSpy.mockReturnValue({ orgAdmin: true, userAccessAdministrator: false });
  });

  describe('role and group', () => {
    it('should render correctly with router', async () => {
      const store = mockStore({
        roleReducer: {},
        groupReducer: {
          selectedGroup: {
            system: false,
          },
        },
      });
      fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({ data: 'something' }) }));
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
      fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({ data: 'something' }) }));
      let container;
      await act(async () => {
        const { container: ci } = render(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/groups/detail/123/roles/detail/456']}>
              <Routes>
                <Route path="/groups/detail/:groupId/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>,
        );

        container = ci;
      });
      expect(store.getActions()[0]).toMatchObject({ type: 'FETCH_ROLE_PENDING' });
      expect(store.getActions()[1]).toMatchObject({ type: 'FETCH_GROUP_PENDING' });
      expect(store.getActions()[2]).toMatchObject({
        payload: {
          data: 'something',
        },
        type: 'FETCH_ROLE_FULFILLED',
      });
      expect(container).toMatchSnapshot();
    });

    it('should render correctly with router and redux store', async () => {
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
      fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
      let container;
      await act(async () => {
        const { container: ci } = render(
          <Provider
            store={mockStore({
              ...initialState,
              groupReducer: {
                selectedGroup: {
                  loaded: true,
                  name: 'Another name',
                },
              },
            })}
          >
            <MemoryRouter initialEntries={['/groups/detail/123/roles/detail/456']}>
              <Routes>
                <Route path="/groups/detail/:groupId/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>,
        );

        container = ci;
      });
      expect(container).toMatchSnapshot();
    });
  });

  describe('role only', () => {
    it('should render correctly with router', async () => {
      const store = mockStore({
        groupReducer: { error: undefined },
        roleReducer: {},
      });
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));

      let container;
      await act(async () => {
        const { container: ci } = render(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/roles/detail/1234']}>
              <Routes>
                <Route path="/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>,
        );
        container = ci;
      });
      expect(store.getActions()[0]).toMatchObject({ type: 'FETCH_ROLE_PENDING' });
      expect(store.getActions()[1]).toMatchObject({
        payload: {
          data: 'something',
        },
        type: 'FETCH_ROLE_FULFILLED',
      });
      expect(container).toMatchSnapshot();
    });

    it('should render correctly with router and redux store', async () => {
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
      let container;
      await act(async () => {
        const { container: ci } = render(
          <Provider store={mockStore(initialState)}>
            <MemoryRouter initialEntries={['/roles/detail/1234']}>
              <Routes>
                <Route path="/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>,
        );

        container = ci;
      });
      expect(container).toMatchSnapshot();
    });
  });

  it('should render correctly with loading', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider
          store={mockStore({
            groupReducer: { error: undefined },
            roleReducer: {
              isRecordLoading: true,
            },
          })}
        >
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
  });

  it('should render permissions table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );

      container = ci;
    });
    expect(container).toMatchSnapshot();
  });

  it('should render top toolbar', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
      container = ci;
    });
    expect(container).toMatchSnapshot();
  });

  it('should render second page of table', async () => {
    jest.useFakeTimers();
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider
          store={mockStore({
            ...initialState,
            roleReducer: {
              selectedRole: {
                access: [...new Array(28)].map(() => ({ permission: 'some:permission' })),
              },
            },
          })}
        >
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );

      container = ci;
    });
    // The +1 is for the header row
    expect(screen.getAllByRole('row')).toHaveLength(20 + 1);

    await act(async () => {
      await fireEvent.click(screen.getAllByLabelText('Go to next page')[0]);
    });

    // Flush all promises
    await act(async () => {
      jest.runAllTimers();
    });

    // The +1 is for the header row
    expect(screen.getAllByRole('row')).toHaveLength(8 + 1);
    expect(container.querySelector('table')).toMatchSnapshot();
  });

  it('should open and cancel remove modal', async () => {
    jest.useFakeTimers();
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/iam/user-access/roles/detail/1234']}>
            <Routes>
              <Route path="/iam/user-access/roles/detail/:roleId/*" element={<Role />}>
                <Route path="remove" element={<RemoveRoleModal cancelRoute="/iam/user-access/roles/detail/1234" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(() => screen.getByText('Delete role?')).toThrow();

    await act(async () => {
      await fireEvent.click(screen.getByLabelText('Actions'));
    });

    await act(async () => {
      await fireEvent.click(screen.getByText('Delete'));
    });

    expect(screen.getByText('Delete role?')).toBeInTheDocument();

    await act(async () => {
      await fireEvent.click(screen.getByText('Cancel'));
    });

    // flush all promises
    await act(async () => {
      await Promise.resolve();
    });
    expect(() => screen.getByText('Delete role?')).toThrow();
  });

  it('should open and close remove modal', async () => {
    getRoleAccessSpy.mockResolvedValueOnce({ data: [] });
    updateRoleSpy.mockResolvedValueOnce({ payload: {} });
    /**Two fetch role API calls */
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/iam/user-access/roles/detail/1234']}>
            <Routes>
              <Route path="/iam/user-access/roles/detail/:roleId/*" element={<Role />}>
                <Route path="remove" element={<WarningModal cancelRoute="/iam/user-access/roles/detail/1234" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(() => screen.getByText('Remove permission?')).toThrow();
    // TableView uses direct action buttons instead of kebab toggles
    // Click the first "Remove" button in the row actions
    await act(async () => {
      await fireEvent.click(screen.getAllByText('Remove')[0]);
    });

    expect(screen.getByText('Remove permission?')).toBeInTheDocument();

    await act(async () => {
      await fireEvent.click(screen.getByText('Cancel'));
    });

    expect(() => screen.getByText('Remove permission?')).toThrow();
  });

  it('should check permission and remove it', async () => {
    getRoleAccessSpy.mockResolvedValueOnce({ payload: { data: [] } });
    updateRoleSpy.mockResolvedValueOnce({ payload: {} });
    /**Two fetch role API calls */
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));

    let store = mockStore(initialState);
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/iam/user-access/roles/detail/1234']}>
            <Routes>
              <Route path="/iam/user-access/roles/detail/:roleId/*" element={<Role />}>
                <Route path="remove" element={<WarningModal cancelRoute="/iam/user-access/roles/detail/1234" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });

    // Select the first row
    await act(async () => {
      await fireEvent.click(screen.getByLabelText('Select row 0'));
    });

    // TableView shows a bulk "Remove (1)" button when rows are selected
    await act(async () => {
      fireEvent.click(screen.getByText(/Remove.*\(1\)/));
    });

    // Confirm removal in modal
    await act(async () => {
      await fireEvent.click(screen.getByText('Remove permission'));
    });
    const expectedPayload = [
      { type: `${FETCH_ROLE}_PENDING` },
      expect.objectContaining({ type: `${FETCH_ROLE}_FULFILLED` }),
      { type: `${UPDATE_ROLE}_PENDING` },
      { payload: {}, type: `${UPDATE_ROLE}_FULFILLED` },
      { type: `${FETCH_ROLE}_PENDING` },
      { payload: {}, type: `${FETCH_ROLE}_FULFILLED` },
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
