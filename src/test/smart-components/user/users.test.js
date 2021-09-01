import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import Users from '../../../smart-components/user/users';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { usersInitialState } from '../../../redux/reducers/user-reducer';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

import * as UserHelper from '../../../helpers/user/user-helper';
import { defaultSettings } from '../../../helpers/shared/pagination';

describe('<Users />', () => {
  let enhanceState;
  const middlewares = [promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchUsersSpy = jest.spyOn(UserHelper, 'fetchUsers');

  beforeEach(() => {
    enhanceState = {
      data: [
        { username: 'user', email: 'user@redhat.com', first_name: 'User', last_name: 'User', is_active: true },
        { username: 'user2', email: 'user2@redhat.com', first_name: 'User2', last_name: 'User2', is_active: false },
      ],
      meta: {
        count: 39,
        limit: 10,
        offset: undefined,
      },
      filters: { status: ['Active'] },
      pagination: defaultSettings,
    };
    mockStore = configureStore(middlewares);
    initialState = { userReducer: { ...usersInitialState, users: enhanceState } };
  });

  afterEach(() => {
    fetchUsersSpy.mockReset();
  });

  it('should render user list correctly', async () => {
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <Router initialEntries={['/users']}>
            <Users />
          </Router>
        </Provider>
      );
    });
    expect(wrapper.find(TableToolbarView)).toHaveLength(1);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      filters: {
        status: ['Active'],
        email: undefined,
        username: undefined,
      },
      inModal: false,
    });
  });

  it('should fetch users on mount', () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    mount(
      <Provider store={store}>
        <Router initialEntries={['/users']}>
          <Users />
        </Router>
        ,
      </Provider>
    );
    const expectedPayload = [{ type: 'FETCH_USERS_PENDING' }];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      filters: {
        status: ['Active'],
        email: undefined,
        username: undefined,
      },
      inModal: false,
    });
  });

  it('should fetch users on sort click', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <Router initialEntries={['/users']}>
            <Users />
          </Router>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('span.pf-c-table__sort-indicator').first().simulate('click');
    });
    const expectedPayload = [expect.objectContaining({ type: 'FETCH_USERS_PENDING' }), expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' })];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledTimes(2);
    expect(fetchUsersSpy).toHaveBeenLastCalledWith({
      count: 39,
      limit: 10,
      orderBy: '-username',
      filters: {
        status: ['Active'],
        email: undefined,
        username: undefined,
      },
      inModal: false,
    });
  });

  it('should fetch users on filter', async () => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    const wrapper = mount(
      <Provider store={store}>
        <Router initialEntries={['/users']}>
          <Users />
        </Router>
      </Provider>
    );
    const target = wrapper.find('input#filter-by-username').first();
    target.getDOMNode().value = 'something';
    await act(async () => {
      target.simulate('change');
    });
    await act(async () => {
      jest.runAllTimers();
    });
    wrapper.update();
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({ type: 'UPDATE_USERS_FILTERS' }),
      expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' }),
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' }),
    ];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledTimes(2);
    expect(fetchUsersSpy).toHaveBeenLastCalledWith({
      count: 39,
      limit: 10,
      orderBy: 'username',
      filters: { status: ['Active'], username: 'something', email: undefined },
      inModal: false,
    });
  });
});
