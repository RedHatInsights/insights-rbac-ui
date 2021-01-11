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
import { mock } from '../../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../../utilities/constants';

describe('<User />', () => {

  const middlewares = [ promiseMiddleware ];
  let mockStore;
  let enhanceState;
  let initialState;

  beforeEach(() => {
    enhanceState = {
      data: [
        { username: 'epacific-insights', email: 'user@redhat.com', first_name: 'User', last_name: 'User', is_active: true }
      ],
      meta: {
        count: 39,
        limit: 10,
        offset: undefined
      }
    };
    mockStore = configureStore(middlewares);
    initialState = {
      userReducer: { ...usersInitialState, users: enhanceState },
      roleReducer: {
        ...rolesInitialState
      }
    };
  });

  afterEach(() => {
    mock.reset();
  });

  it('should render user', async () => {
    mock.onGet(`${RBAC_API_BASE}/principals/?limit=0&offset=0&usernames=epacific-insights&sort_order=asc`).reply(200, {});
    mock.onGet(`${RBAC_API_BASE}/roles/?limit=20&offset=0&add_fields=groups_in&username=epacific-insights`).reply(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(<Provider store={ mockStore(initialState) }>
        <MemoryRouter initialEntries={ [
          '/users/detail/epacific-insights'
        ] }>
          <Route path="/users/detail/:username" component={ user } />
        </MemoryRouter>
      </Provider>);
    });
    wrapper.update();
    expect(wrapper.find(user)).toHaveLength(1);
  });

 });
