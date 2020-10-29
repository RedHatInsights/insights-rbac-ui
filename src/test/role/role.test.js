import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import Role from '../../smart-components/role/role';
import toJson from 'enzyme-to-json';
import { FETCH_GROUP, FETCH_ROLE, UPDATE_ROLE } from '../../redux/action-types';

import * as RoleActions from '../../redux/actions/role-actions';
import * as GroupActions from '../../redux/actions/group-actions';
import * as UserLogin from '../../helpers/shared/user-login';

describe('role', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let initialState;

  const roleApi = UserLogin.getRoleApi();

  const fetchRoleSpy = jest.spyOn(RoleActions, 'fetchRole');
  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');
  const getRoleAccessSpy = jest.spyOn(roleApi, 'getRoleAccess');
  const updateRoleSpy = jest.spyOn(roleApi, 'updateRole');
  const removeRolePermissionsSpy = jest.spyOn(RoleActions, 'removeRolePermissions');

  removeRolePermissionsSpy.mockImplementation(() => ({ type: UPDATE_ROLE, payload: Promise.resolve({}) }));

  afterEach(() => {
    fetchRoleSpy.mockReset();
    fetchGroupSpy.mockReset();
    getRoleAccessSpy.mockReset();
    updateRoleSpy.mockReset();
  });

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = {
      roleReducer: {
        isRecordLoading: false,
        selectedRole: {
          uuid: '1234',
          display_name: 'name',
          description: 'description',
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
    };
  });

  describe('role only', () => {
    it('should render correctly with router', async () => {
      const store = mockStore({
        roleReducer: {},
      });
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));

      let wrapper;
      await act(async () => {
        wrapper = mount(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/roles/detail/1234']}>
              <Route path="/roles/detail/:uuid" component={Role} />
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
              <Route path="/roles/detail/:uuid" component={Role} />
            </MemoryRouter>
          </Provider>
        );
      });
      wrapper.update();
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(2);
    });
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
      fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
      fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({ data: 'something' }) }));
      let wrapper;
      await act(async () => {
        wrapper = mount(
          <Provider store={store}>
            <MemoryRouter initialEntries={['/groups/detail/123/roles/detail/456']}>
              <Route path="/groups/detail/:groupUuid/roles/detail/:uuid" component={Role} />
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
      expect(store.getActions()[3]).toMatchObject({
        payload: { data: 'something' },
        type: 'FETCH_GROUP_FULFILLED',
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
              <Route path="/groups/detail/:groupUuid/roles/detail/:uuid" component={Role} />
            </MemoryRouter>
          </Provider>
        );
      });
      wrapper.update();
      expect(wrapper.find('.pf-c-breadcrumb__item').length).toBe(3);
    });
  });

  it('should render correctly with loading', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider
          store={mockStore({
            roleReducer: {
              isRecordLoading: true,
            },
          })}
        >
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Route path="/roles/detail/:uuid" component={Role} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.ins-c-skeleton').length).toBe(5);
  });

  it('should render permissions table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Route path="/roles/detail/:uuid" component={Role} />
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
            <Route path="/roles/detail/:uuid" component={Role} />
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
            <Route path="/roles/detail/:uuid" component={Role} />
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
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234']}>
            <Route path="/roles/detail/:uuid" component={Role} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(0);
    wrapper.find('button.pf-c-dropdown__toggle').last().simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(1);
    wrapper.find('button.pf-m-link').simulate('click');
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(0);
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
            <Route path="/roles/detail/:uuid" component={Role} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(0);
    wrapper.find('button.pf-c-dropdown__toggle').last().simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(1);
    wrapper.find('button.pf-m-danger').simulate('click');
    expect(wrapper.find('RemovePermissionsModal')).toHaveLength(0);
  });

  it('should chould check permission and remove it', async () => {
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
            <Route path="/roles/detail/:uuid" component={Role} />
          </MemoryRouter>
        </Provider>
      );
    });
    await act(async () => {
      wrapper.update();
    });

    wrapper.find('input[type="checkbox"]').at(0).simulate('click');
    wrapper.find('button[aria-label="Actions"]').at(2).simulate('click');
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
