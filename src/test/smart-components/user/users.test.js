import React from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import Users from '../../../features/users/users';
import { usersInitialState } from '../../../redux/users/reducer';
import * as UserHelper from '../../../redux/users/helper';
import { defaultSettings } from '../../../helpers/pagination';
import PermissionsContext from '../../../utilities/permissionsContext';

describe('<Users />', () => {
  let enhanceState;
  const middlewares = [promiseMiddleware];
  let mockStore;
  let initialState;
  const adminPermissions = {
    orgAdmin: true,
    userAccessAdministrator: false,
  };

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
        <PermissionsContext.Provider value={adminPermissions}>
          <Router initialEntries={['/users']}>
            <Routes>
              <Route path="/users/*" element={<Users />} />
            </Routes>
          </Router>
        </PermissionsContext.Provider>
      </Provider>,
    );
    expect(screen.getAllByText('Username')).toHaveLength(2);
    expect(fetchUsersSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        filters: expect.objectContaining({
          status: ['Active'],
        }),
        usesMetaInURL: true,
      }),
    );
  });

  it('should fetch users on mount', () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    render(
      <Provider store={store}>
        <PermissionsContext.Provider value={adminPermissions}>
          <Router initialEntries={['/users']}>
            <Routes>
              <Route path="/users/*" element={<Users />} />
            </Routes>
          </Router>
        </PermissionsContext.Provider>
      </Provider>,
    );
    // Component dispatches UPDATE_USERS_FILTERS followed by FETCH_USERS_PENDING
    const actions = store.getActions();
    expect(actions).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'UPDATE_USERS_FILTERS' }), expect.objectContaining({ type: 'FETCH_USERS_PENDING' })]),
    );
    expect(fetchUsersSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        filters: expect.objectContaining({
          status: ['Active'],
        }),
        usesMetaInURL: true,
      }),
    );
  });

  it('should fetch users on sort click', async () => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementation(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await act(async () => {
      render(
        <Provider store={store}>
          <PermissionsContext.Provider value={adminPermissions}>
            <Router initialEntries={['/users']}>
              <Routes>
                <Route path="/users/*" element={<Users />} />
              </Routes>
            </Router>
          </PermissionsContext.Provider>
        </Provider>,
      );
    });

    // Wait for initial render
    await screen.findByText('user');

    // Clear spy calls from initial render
    fetchUsersSpy.mockClear();
    store.clearActions();

    // Find and click the sortable Username column header button
    const usernameHeaders = await screen.findAllByText('Username');
    // The sortable header has a button inside it
    const sortableHeader = usernameHeaders[1].closest('th');
    const sortButton = sortableHeader?.querySelector('button');
    expect(sortButton).toBeTruthy();

    await user.click(sortButton);

    // Run timers to trigger debounced fetch
    await act(async () => {
      jest.runAllTimers();
    });

    // Verify sort was called with descending order (clicking ascending column toggles to descending)
    expect(fetchUsersSpy).toHaveBeenCalled();
    expect(fetchUsersSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 20,
        orderBy: '-username',
        filters: expect.objectContaining({
          status: ['Active'],
        }),
        usesMetaInURL: true,
      }),
    );
  });

  it('should fetch users on filter', async () => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: 'foo', payload: Promise.resolve({}) }));
    await render(
      <Provider store={store}>
        <PermissionsContext.Provider value={adminPermissions}>
          <Router initialEntries={['/users']}>
            <Routes>
              <Route path="/users/*" element={<Users />} />
            </Routes>
          </Router>
        </PermissionsContext.Provider>
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
    expect(fetchUsersSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 20,
        filters: expect.objectContaining({
          status: ['Active'],
          username: 'something',
        }),
        usesMetaInURL: true,
      }),
    );
  });
});
