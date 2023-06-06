import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import toJson from 'enzyme-to-json';
import Role from '../../smart-components/role/role';
import { FETCH_GROUP, FETCH_SYSTEM_GROUP, FETCH_ROLE, UPDATE_ROLE } from '../../redux/action-types';

import * as RoleActions from '../../redux/actions/role-actions';
import * as GroupActions from '../../redux/actions/group-actions';
import * as UserLogin from '../../helpers/shared/user-login';
import RemoveModal from '../../presentational-components/shared/RemoveModal';
import { defaultSettings } from '../../helpers/shared/pagination';
import pathnames from '../../utilities/pathnames';

describe('role', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let initialState;

  const roleApi = UserLogin.getRoleApi();

  const fetchSystemGroupSpy = jest.spyOn(GroupActions, 'fetchSystemGroup');
  const fetchRoleSpy = jest.spyOn(RoleActions, 'fetchRole');
  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');
  const getRoleAccessSpy = jest.spyOn(roleApi, 'getRoleAccess');
  const updateRoleSpy = jest.spyOn(roleApi, 'updateRole');
  const removeRolePermissionsSpy = jest.spyOn(RoleActions, 'removeRolePermissions');

  removeRolePermissionsSpy.mockImplementation(() => ({ type: UPDATE_ROLE, payload: Promise.resolve({}) }));

  afterEach(() => {
    fetchSystemGroupSpy.mockReset();
    fetchRoleSpy.mockReset();
    fetchGroupSpy.mockReset();
    getRoleAccessSpy.mockReset();
    updateRoleSpy.mockReset();
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
      let wrapper;
      await act(async () => {
        wrapper = mount(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/groups/detail/123/roles/detail/456']}>
              <Routes>
                <Route path="/groups/detail/:groupId/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );
      });
      wrapper.update();
      expect(store.getActions()[0]).toMatchObject({ type: 'FETCH_ROLE_PENDING' });
      expect(store.getActions()[1]).toMatchObject({ type: 'FETCH_GROUP_PENDING' });
      expect(store.getActions()[2]).toMatchObject({
        payload: {
          data: 'something',
        },
        type: 'FETCH_ROLE_FULFILLED',
      });
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(1);
    });

    it('should render correctly with router and redux store', async () => {
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
      fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
      let wrapper;
      await act(async () => {
        wrapper = mount(
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
          </Provider>
        );
      });
      wrapper.update();
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(3);
    });
  });

  describe('role only', () => {
    it('should render correctly with router', async () => {
      const store = mockStore({
        groupReducer: { error: undefined },
        roleReducer: {},
      });
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));

      let wrapper;
      await act(async () => {
        wrapper = mount(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/roles/detail/1234']}>
              <Routes>
                <Route path="/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );
      });
      wrapper.update();
      expect(store.getActions()[0]).toMatchObject({ type: 'FETCH_ROLE_PENDING' });
      expect(store.getActions()[1]).toMatchObject({
        payload: {
          data: 'something',
        },
        type: 'FETCH_ROLE_FULFILLED',
      });
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(1);
    });

    it('should render correctly with router and redux store', async () => {
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
      let wrapper;
      await act(async () => {
        wrapper = mount(
          <Provider store={mockStore(initialState)}>
            <MemoryRouter initialEntries={['/roles/detail/1234']}>
              <Routes>
                <Route path="/roles/detail/:roleId/*" element={<Role />} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );
      });
      wrapper.update();
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(2);
    });
  });

  it('should render correctly with loading', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
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
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.ins-c-skeleton').length).toBe(10);
  });

  it('should render permissions table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.pf-c-pagination__nav button').first().props().disabled).toBe(true);
    expect(toJson(wrapper.find('.pf-c-table'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render top toolbar', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(toJson(wrapper.find('TopToolbar'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render second page of table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
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
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.pf-c-table tbody tr').length).toBe(20);
    wrapper.find('.pf-c-pagination__nav button[data-action="next"]').first().simulate('click');
    wrapper.update();
    expect(wrapper.find('.pf-c-table tbody tr').length).toBe(8);
    expect(toJson(wrapper.find('.pf-c-table'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should open and cancel remove modal', async () => {
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find(RemoveModal)).toHaveLength(0);
    wrapper.find('button.pf-c-dropdown__toggle').last().simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');
    expect(wrapper.find(RemoveModal)).toHaveLength(1);
    wrapper.find('button.pf-m-link').simulate('click');
    expect(wrapper.find(RemoveModal)).toHaveLength(0);
  });

  it('should open and close remove modal', async () => {
    getRoleAccessSpy.mockResolvedValueOnce({ data: [] });
    updateRoleSpy.mockResolvedValueOnce({ payload: {} });
    /**Two fetch role API calls */
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find(RemoveModal)).toHaveLength(0);
    wrapper.find('button.pf-c-dropdown__toggle').last().simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');
    expect(wrapper.find(RemoveModal)).toHaveLength(1);
    wrapper.find('button.pf-m-danger').simulate('click');
    expect(wrapper.find(RemoveModal)).toHaveLength(0);
  });

  it('should check permission and remove it', async () => {
    getRoleAccessSpy.mockResolvedValueOnce({ payload: { data: [] } });
    updateRoleSpy.mockResolvedValueOnce({ payload: {} });
    /**Two fetch role API calls */
    fetchRoleSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    let store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Routes>
              <Route path="/roles/detail/:roleId/*" element={<Role />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    await act(async () => {
      wrapper.update();
    });

    wrapper.find('button.pf-c-dropdown__toggle').last().simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');

    await act(async () => {
      wrapper.find('button.pf-m-danger').simulate('click');
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
