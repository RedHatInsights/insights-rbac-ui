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
        {
          username: 'catalogiqeusr',
          email: 'brahmani+qa@redhat.com',
          first_name: 'Catalog User',
          last_name: 'Rahmanim',
          is_active: true
        }
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
    mock.onGet(`/api/rbac/v1/principals/?limit=10`).replyOnce(200, {});
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
    mock.onGet(`/api/rbac/v1/principals/?limit=10`).replyOnce(200, {});
    mount(
      <Provider store={ store }>
        <Router>
          <Users />
        </Router>,
      </Provider>
    );
    const expectedPayload = [
      { type: 'FETCH_USERS_PENDING' }
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
