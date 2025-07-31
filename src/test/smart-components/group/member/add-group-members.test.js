import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import AddGroupMembers from '../../../../features/groups/member/add-group-members';
import { fireEvent, render, screen } from '@testing-library/react';
import * as UserHelper from '../../../../redux/users/helper';
import * as GroupHelper from '../../../../redux/groups/helper';
import { FETCH_USERS } from '../../../../redux/users/action-types';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    uuid: 'test-group',
  })),
}));

describe('<AddGroupMembers />', () => {
  let initialState;
  let responseBody;
  let mockStore;
  let emptyUsers;

  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const fetchUsersSpy = jest.spyOn(UserHelper, 'fetchUsers');
  const addMembersToGroupSpy = jest.spyOn(GroupHelper, 'addMembersToGroup');
  const fetchMembersForGroup = jest.spyOn(GroupHelper, 'fetchMembersForGroup');
  const fetchGroups = jest.spyOn(GroupHelper, 'fetchGroups');

  beforeEach(() => {
    initialState = {
      groupReducer: {
        groups: {
          data: [
            {
              uuid: '123',
              name: 'SampleGroup',
            },
          ],
        },
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: {
          data: [
            {
              username: 'test_name',
              email: 'testmail@redhat.com',
              first_name: 'test',
              last_name: 'test',
              is_active: true,
            },
          ],
          meta: {
            count: 1,
          },
          filters: {},
        },
      },
    };
    responseBody = {
      data: [
        {
          username: 'test_name',
          email: 'testmail@redhat.com',
          first_name: 'test',
          last_name: 'test',
          is_active: true,
        },
      ],
      meta: {
        count: 1,
        limit: 10,
        offset: undefined,
      },
    };
    emptyUsers = {
      data: [],
      meta: {
        count: 0,
      },
      filters: {},
    };
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchUsersSpy.mockReset();
  });

  test('should render correctly empty', () => {
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    const store = mockStore({ ...initialState, userReducer: { ...initialState.userReducer, users: emptyUsers } });
    const container = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add-members']}>
          <AddGroupMembers />
        </MemoryRouter>
      </Provider>,
    );
    expect(container.baseElement).toMatchSnapshot();
  });

  test('should render correctly', () => {
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    const store = mockStore(initialState);
    const container = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add-members']}>
          <AddGroupMembers />
        </MemoryRouter>
      </Provider>,
    );
    expect(container.baseElement).toMatchSnapshot();
  });

  test('should fetchUsers on load correctly', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve({ type: FETCH_USERS, payload: Promise.resolve(responseBody) }));

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add-members']}>
          <AddGroupMembers />
        </MemoryRouter>
      </Provider>,
    );
    const expectedPayload = [expect.objectContaining({ type: 'FETCH_USERS_PENDING' })];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(screen.getByText('Add members')).toBeInTheDocument();
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      usesMetaInURL: false,
      filters: { status: ['Active'] },
    });
  });

  test('should show a notification on cancel', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add-members']}>
          <AddGroupMembers />
        </MemoryRouter>
      </Provider>,
    );

    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({ type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION' }),
    ];
    fireEvent.click(screen.getByText('Cancel'));
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      usesMetaInURL: false,
      filters: { status: ['Active'] },
    });
  });

  test('should show a notification on submit', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    addMembersToGroupSpy.mockImplementationOnce(() => Promise.resolve());
    fetchMembersForGroup.mockImplementationOnce(() => Promise.resolve());
    fetchGroups.mockImplementationOnce(() => Promise.resolve());
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add-members']}>
          <AddGroupMembers />
        </MemoryRouter>
      </Provider>,
    );

    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
        payload: expect.objectContaining({
          description: 'Adding member to group initialized.',
          title: 'Adding member to group',
          variant: 'info',
        }),
      }),
      expect.objectContaining({ type: 'ADD_MEMBERS_TO_GROUP_PENDING' }),
    ];
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText('Add to group'));
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      usesMetaInURL: false,
      filters: { status: ['Active'] },
    });
    expect(addMembersToGroupSpy).toHaveBeenCalled();
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
