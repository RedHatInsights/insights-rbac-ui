import React from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import Users from '../../../features/users/users';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { usersInitialState } from '../../../redux/users/reducer';
import * as UserHelper from '../../../redux/users/helper';
import { defaultSettings } from '../../../helpers/pagination';

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
    const store = mockStore(initialState);
    render(
      <Provider store={store}>
        <Router initialEntries={['/users']}>
          <Routes>
            <Route path="/users/*" element={<Users />} />
          </Routes>
        </Router>
      </Provider>,
    );
    expect(screen.getAllByText('Username')).toHaveLength(2);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      filters: {
        status: ['Active'],
        email: undefined,
        username: undefined,
      },
      usesMetaInURL: true,
    });
  });

  it('should fetch users on mount', () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    render(
      <Provider store={store}>
        <Router initialEntries={['/users']}>
          <Routes>
            <Route path="/users/*" element={<Users />} />
          </Routes>
        </Router>
        ,
      </Provider>,
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
      usesMetaInURL: true,
    });
  });

  it('should fetch users on sort click', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));

    const user = userEvent.setup();

    await act(async () => {
      render(
        <Provider store={store}>
          <Router initialEntries={['/users']}>
            <Routes>
              <Route path="/users/*" element={<Users />} />
            </Routes>
          </Router>
        </Provider>,
      );
    });
    store.clearActions();
    await user.click((await screen.findAllByText('Username')).at(1));
    const expectedPayload = [expect.objectContaining({ type: 'FETCH_USERS_PENDING' }), expect.objectContaining({ type: 'FETCH_USERS_FULFILLED' })];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledTimes(2);
    expect(fetchUsersSpy).toHaveBeenLastCalledWith({
      count: 0,
      itemCount: 0,
      limit: 20,
      offset: 0,
      redirected: undefined,
      orderBy: '-username',
      filters: {
        status: ['Active'],
        email: undefined,
        username: undefined,
      },
      usesMetaInURL: true,
    });
  });

  it('should fetch users on filter', async () => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    await render(
      <Provider store={store}>
        <Router initialEntries={['/users']}>
          <Routes>
            <Route path="/users/*" element={<Users />} />
          </Routes>
        </Router>
      </Provider>,
    );
    const target = screen.getByRole('textbox');

    expect(target).not.toHaveAttribute('disabled');
    fireEvent.change(target, { target: { value: 'something' } });
    expect(target).toHaveValue('something');
    await act(async () => {
      jest.runAllTimers();
    });

    expect(fetchUsersSpy).toHaveBeenCalledTimes(2);
    expect(fetchUsersSpy).toHaveBeenLastCalledWith({
      limit: 20,
      orderBy: 'username',
      filters: { status: ['Active'], username: 'something', email: '' },
      usesMetaInURL: true,
    });
  });
});
