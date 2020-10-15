import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import { rolesInitialState } from '../../../redux/reducers/role-reducer';
import { usersInitialState } from '../../../redux/reducers/user-reducer';
import user from '../../../smart-components/user/user';
import { FETCH_USERS } from '../../../redux/action-types';
import * as UserActions from '../../../redux/actions/user-actions';
import * as RoleActions from '../../../redux/actions/role-actions';

describe('<User />', () => {
  const middlewares = [promiseMiddleware];
  let mockStore;
  let enhanceState;
  let initialState;

  const fetchUsersSpy = jest.spyOn(UserActions, 'fetchUsers');
  const fetchRolesSpy = jest.spyOn(RoleActions, 'fetchRoles');

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
    };
  });

  afterEach(() => {
    fetchUsersSpy.mockReset();
    fetchRolesSpy.mockReset();
  });

  it('should render user', async () => {
    fetchUsersSpy.mockImplementationOnce(() => ({ type: FETCH_USERS, payload: Promise.resolve({}) }));
    fetchRolesSpy.mockImplementationOnce(() => ({ type: FETCH_USERS, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/users/detail/epacific-insights']}>
            <Route path="/users/detail/:username" component={user} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find(user)).toHaveLength(1);
  });
});
