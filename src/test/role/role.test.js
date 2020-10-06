import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import Role from '../../smart-components/role/role';
import { mock } from '../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../utilities/constants';
import toJson from 'enzyme-to-json';
import { FETCH_ROLE, UPDATE_ROLE } from '../../redux/action-types';

describe('role', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let initialState;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = {
      roleReducer: {
        isRecordLoading: false,
        selectedRole: {
          uuid: '1234',
          display_name: 'name',
          description: 'description',
          access: [{ permission: 'some1:*:read' }, { permission: 'some2:*:write' }, { permission: 'some3:*:execute' }],
        },
      },
    };
  });

  describe('role only', () => {
    it('should render correctly with router', async () => {
      const store = mockStore({
        roleReducer: {},
      });
      mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {
        data: 'something',
      });
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
      mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {});
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
      mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, {
        data: 'something',
      });
      mock.onGet(`${RBAC_API_BASE}/roles/456/`).reply(200, {
        data: 'something',
      });
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
      mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, {});
      mock.onGet(`${RBAC_API_BASE}/roles/456/`).reply(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/groups/1234/`).reply(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/groups/1234/`).reply(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/groups/1234/`).reply(200, {});
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

  it('should render filtered data', async () => {
    mock.onGet(`${RBAC_API_BASE}/groups/1234/`).reply(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider
          store={mockStore({
            roleReducer: {
              isRecordLoading: false,
              selectedRole: {
                uuid: '1234',
                display_name: 'Some name',
                description: 'Some cool description',
                access: [...[...new Array(18)].map(() => ({ permission: 'some:permission:read' })), { permission: 'another:thing:*' }],
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
    expect(wrapper.find('.pf-c-table tbody tr').length).toBe(19);
    wrapper
      .find('.ins-c-primary-toolbar__filter input')
      .first()
      .simulate('change', { target: { value: 'thing' } });
    wrapper.update();
    expect(wrapper.find('.pf-c-table tbody tr').length).toBe(1);
    expect(toJson(wrapper.find('.pf-c-table'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should open and cancel remove modal', async () => {
    mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/roles/1234/access/`).replyOnce(200, { data: [] });
    mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {});
    mock.onPut(`${RBAC_API_BASE}/roles/1234/`).replyOnce(200, {});
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
    mock.onGet(`${RBAC_API_BASE}/roles/1234/access/`).replyOnce(200, { data: [] });
    mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {});
    mock.onPut(`${RBAC_API_BASE}/roles/1234/`).replyOnce(200, {});
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
    wrapper.find('input[type="checkbox"]').at(0).simulate('click');
    wrapper.find('button[aria-label="Actions"]').at(3).simulate('click');
    wrapper.find('button.pf-c-dropdown__menu-item').first().simulate('click');
    wrapper.find('button.pf-m-danger').simulate('click');
    const expectedPayload = [
      { type: `${FETCH_ROLE}_PENDING` },
      expect.objectContaining({ type: `${FETCH_ROLE}_FULFILLED` }),
      { type: `${UPDATE_ROLE}_PENDING` },
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
