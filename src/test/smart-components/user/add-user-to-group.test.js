import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as groupActions from '../../../redux/actions/group-actions';
import AddUserToGroup from '../../../smart-components/user/add-user-to-group/add-user-to-group';
import { ADD_MEMBERS_TO_GROUP, FETCH_GROUPS } from '../../../redux/action-types.js';
import PermissionsContext from '../../../utilities/permissions-context';
import messages from '../../../Messages';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';

const mockStore = configureMockStore([thunk]);
const initialState = {
  groupReducer: {
    groups: {
      data: [],
      isLoading: false,
    },
  },
};

const renderComponent = (userName = 'testuser', store, isAdmin = true) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <PermissionsContext.Provider
          value={{
            userAccessAdministrator: isAdmin,
            orgAdmin: isAdmin,
          }}
        >
          <AddUserToGroup username={userName} />
        </PermissionsContext.Provider>
      </MemoryRouter>
    </Provider>,
  );
};

jest.mock('@redhat-cloud-services/frontend-components-notifications/', () => ({
  ...jest.requireActual('@redhat-cloud-services/frontend-components-notifications/'),
  addNotification: jest.fn(),
}));

const testGroups = [
  {
    uuid: '1',
    name: 'Group 1',
    description: 'The best group',
  },
  {
    uuid: '2',
    name: 'Group 2',
    description: 'The second best',
  },
];

describe('Add User to Group Wizard', () => {
  let fetchGroups, addMembersToGroup, store;

  beforeEach(() => {
    jest.clearAllMocks();

    fetchGroups = jest.spyOn(groupActions, 'fetchGroups');
    addMembersToGroup = jest.spyOn(groupActions, 'addMembersToGroup');

    store = mockStore({
      ...initialState,
      groupReducer: {
        groups: {
          data: testGroups,
          isLoading: false,
        },
      },
    });

    store.dispatch = jest.fn();

    fetchGroups.mockImplementationOnce(() => ({
      type: FETCH_GROUPS,
      payload: Promise.resolve({
        value: {
          data: testGroups,
          meta: {
            count: testGroups.length,
            limit: 10,
            offset: 0,
          },
        },
      }),
    }));
  });

  test('Add to group wizard renders correctly', () => {
    const store = mockStore(initialState);

    renderComponent('testuser', store);
    expect(screen.getByText(/Add to group/i)).toBeInTheDocument();
  });

  test('FetchGroups action dispatched on component mount', () => {
    const store = mockStore(initialState);
    renderComponent('testuser', store);
    expect(fetchGroups).toHaveBeenCalled();
  });

  test('User groups table is rendered, with fetch group action dispatched', async () => {
    renderComponent('testUser', store);

    expect(fetchGroups).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText('groups table')));
    await waitFor(() => expect(screen.getByText(`${messages.onlyNonUserGroupsVisible.defaultMessage}`)));
  });

  test('Cannot add to group if the user is non-admin', () => {
    renderComponent('testUser', store, false);

    expect(screen.queryByLabelText('Select row 0')).toBeNull();
    expect(screen.queryByLabelText('Save')).toBeDisabled();
  });

  test('Can select group and add user to it', async () => {
    addMembersToGroup.mockImplementationOnce(() => ({
      type: ADD_MEMBERS_TO_GROUP,
      payload: Promise.resolve({
        value: {
          groupUuid: '1',
          userUuid: 'testUser',
        },
      }),
    }));
    renderComponent('testUser', store);

    await waitFor(() => expect(screen.getByLabelText(`group-name-${testGroups[0].uuid}`)));
    userEvent.click(screen.getByLabelText(`Select row 0`));
    userEvent.click(screen.getByLabelText(`Save`));

    await waitFor(() => expect(addMembersToGroup).toHaveBeenCalled());
  });

  test('Displays cancel warning notification when clicking cancel button', async () => {
    renderComponent('testUser', store);

    await waitFor(() => expect(screen.getByLabelText(`group-name-${testGroups[0].uuid}`)));

    userEvent.click(screen.getByLabelText('Cancel'));

    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith({
        variant: 'warning',
        title: messages.addingGroupMemberTitle.defaultMessage,
        dismissDelay: 8000,
        description: messages.addingGroupMemberCancelled.defaultMessage,
      }),
    );
  });

  test('Filtering groups by name works correctly', async () => {
    renderComponent('testUser', store);

    await waitFor(() => expect(screen.getByLabelText('groups table')));

    const filterInput = screen.getByLabelText(/text input/i);
    userEvent.type(filterInput, 'Group 2');
    await waitFor(() => expect(screen.getByText('Group 2')).toBeInTheDocument());
  });
});
