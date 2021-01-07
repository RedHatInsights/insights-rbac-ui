import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import toJson from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import Roles from '../../smart-components/role/roles';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { rolesInitialState } from '../../redux/reducers/role-reducer';

import * as RoleActions from '../../redux/actions/role-actions';
import { FETCH_ROLES } from '../../redux/action-types';

describe('<Roles />', () => {
  const middlewares = [promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchRolesWithPoliciesSpy = jest.spyOn(RoleActions, 'fetchRolesWithPolicies');
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
              system: 'test',
              accessCount: 'test',
              groups_in_count: 5,
              modified: new Date(0),
            },
          ],
        },
        isLoading: false,
      },
    };
  });

  afterEach(() => {
    // fetchRolesSpy.mockReset();
    fetchRolesWithPoliciesSpy.mockReset();
  });

  it('should render correctly', async () => {
    const store = mockStore(initialState);
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles']}>
            <Route path="/roles" component={Roles} />
          </MemoryRouter>
        </Provider>
      );
    });

    wrapper.update();
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    const store = mockStore({
      ...initialState,
      roleReducer: {
        ...initialState.roleReducer,
        isLoading: true,
      },
    });
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/roles']}>
          <Route path="/roles" component={Roles} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('ListLoader'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly in org admin', () => {
    fetchRolesWithPoliciesSpy.mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
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
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/roles']}>
          <Route path="/roles" component={Roles} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should fetch roles on sort click', async () => {
    const store = mockStore(initialState);
    fetchRolesWithPoliciesSpy
      .mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_ROLES, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles']}>
            <Route path="/roles" component={Roles} />
          </MemoryRouter>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('span.pf-c-table__sort-indicator').first().simulate('click');
    });
    expect(fetchRolesWithPoliciesSpy).toHaveBeenCalledTimes(2);
    expect(fetchRolesWithPoliciesSpy).toHaveBeenNthCalledWith(1, { name: '' });
    expect(fetchRolesWithPoliciesSpy).toHaveBeenNthCalledWith(2, { limit: 20, orderBy: '-display_name' });
  });
});
