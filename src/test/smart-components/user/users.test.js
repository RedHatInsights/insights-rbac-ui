import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store' ;
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import Users from '../../../smart-components/user/users';
import { mock } from '../../__mocks__/apiMock';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { usersInitialState } from '../../../redux/reducers/user-reducer';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

describe('<Users />', () => {

  let enhanceState;
  const middlewares = [ promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    enhanceState = {
      data: [
        { username: 'user', email: 'user@redhat.com', first_name: 'User', last_name: 'User', is_active: true },
        { username: 'user2', email: 'user2@redhat.com', first_name: 'User2', last_name: 'User2', is_active: false }
      ],
      meta: {
        count: 39,
        limit: 10,
        offset: undefined
      }
    };
    mockStore = configureStore(middlewares);
    initialState = { userReducer: { ...usersInitialState, users: enhanceState }};
  });

  afterEach(() => {
    mock.reset();
  });

  it('should render user list correctly', async() => {
    mock.onGet(`/api/rbac/v1/principals/?limit=20&sort_order=asc`).replyOnce(200, {});
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/users' ] }>
            <Users />
          </Router>
        </Provider>
      );
    });
    expect(wrapper.find(TableToolbarView)).toHaveLength(1);
  });

  it('should fetch users on mount', () => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/principals/?limit=20&sort_order=asc`).replyOnce(200, {});
    mount(
      <Provider store={ store }>
        <Router initialEntries={ [ '/users' ] }>
          <Users />
        </Router>,
      </Provider>
    );
    const expectedPayload = [
      { type: 'FETCH_USERS_PENDING' }
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });

  it('should fetch users on sort click', async() => {
    const store = mockStore(initialState);
    mock.onGet('/api/rbac/v1/principals/?limit=20&sort_order=asc').replyOnce(200, {});
    mock.onGet('/api/rbac/v1/principals/?limit=10&sort_order=desc').replyOnce(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/users' ] }>
            <Users />
          </Router>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('span.pf-c-table__sort-indicator').first().simulate('click');
    });
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),

      expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' })
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });

  it('should fetch users on filter', async() => {
    const store = mockStore(initialState);
    mock.onGet('/api/rbac/v1/principals/?limit=20&sort_order=asc').replyOnce(200, {});
    mock.onGet('/api/rbac/v1/principals/?limit=10&sort_order=desc').replyOnce(200, {});
    const wrapper = mount(<Provider store={ store }>
      <Router initialEntries={ [ '/users' ] }>
        <Users />
      </Router>
    </Provider>);
    const target = wrapper.find('input#filter-by-username');
    target.getDOMNode().value = 'something';
    await act(async () => {
      target.simulate('change');
    });
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),

      expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' })
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
