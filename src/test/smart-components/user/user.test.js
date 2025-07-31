import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { rolesInitialState } from '../../../redux/roles/reducer';
import { usersInitialState } from '../../../redux/users/reducer';
import User from '../../../features/users/user';
import { FETCH_ADMIN_GROUP } from '../../../redux/groups/action-types';
import { FETCH_USERS } from '../../../redux/users/action-types';
import * as UserActions from '../../../redux/users/actions';
import * as RoleActions from '../../../redux/roles/actions';
import * as GroupActions from '../../../redux/groups/actions';

jest.mock('../../../redux/users/actions', () => {
  const actions = jest.requireActual('../../../redux/users/actions');
  return {
    __esModule: true,
    ...actions,
  };
});

jest.mock('../../../redux/groups/actions', () => {
  const actions = jest.requireActual('../../../redux/groups/actions');
  return {
    __esModule: true,
    ...actions,
  };
});

jest.mock('../../../redux/roles/actions', () => {
  const actions = jest.requireActual('../../../redux/roles/actions');
  return {
    __esModule: true,
    ...actions,
  };
});

describe('<User />', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let enhanceState;
  let initialState;

  const fetchUsersSpy = jest.spyOn(UserActions, 'fetchUsers');
  const fetchRolesSpy = jest.spyOn(RoleActions, 'fetchRoles');
  const fetchAdminGroupSpy = jest.spyOn(GroupActions, 'fetchAdminGroup');

  beforeEach(() => {
    enhanceState = {
      data: [{ username: 'epacific-insights', email: 'user@redhat.com', first_name: 'User', last_name: 'User', is_active: true }],
      meta: {
        count: 39,
        limit: 10,
        offset: undefined,
      },
    };
    mockStore = configureStore(middlewares);
    initialState = {
      userReducer: { ...usersInitialState, users: enhanceState },
      roleReducer: {
        ...rolesInitialState,
      },
      groupReducer: {
        adminGroup: {},
      },
    };
  });

  it('should render user', async () => {
    fetchUsersSpy.mockImplementationOnce(() => ({ type: FETCH_USERS, payload: Promise.resolve({}) }));
    fetchRolesSpy.mockImplementationOnce(() => ({ type: FETCH_USERS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    let container;
    await act(async () => {
      const { container: ci } = render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/users/detail/epacific-insights']}>
            <Routes>
              <Route path="/users/detail/:username/*" element={<User />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
      container = ci;
    });
    expect(container).toMatchSnapshot();
  });
});
