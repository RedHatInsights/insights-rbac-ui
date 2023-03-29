import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react'; 
import { MemoryRouter, useHistory} from 'react-router-dom';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import AddUserToGroup from '../../../smart-components/user/add-user-to-group/add-user-to-group';
import * as groupActions from '../../../redux/actions/group-actions';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { FETCH_GROUPS, ADD_MEMBERS_TO_GROUP } from '../../../redux/action-types.js';

const mockStore = configureMockStore([thunk]);
const initialState = {
  groupReducer: {
    groups: {
      data: [],
      isLoading: false,
    },
  },
};

const renderComponent = (userName = 'testuser', store) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AddUserToGroup username={userName} />
      </MemoryRouter>
    </Provider>
  );
};

const testGroups = [
  {
     uuid: '1',
     name: 'Group 1',
     description: "The best group",
  },
  {
    uuid: '2',
    name: 'Group 2',
    description: 'The second best',
  }
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
    screen.debug();
  });

  test('Can select group and add user to it', async () => {
    renderComponent('testUser', store);

    await waitFor(() => expect(screen.getByLabelText(`group-name-${testGroups[0].uuid}`)));
    // userEvent.click(screen.getByLabelText(`Select row 0`));
    userEvent.click(screen.getByRole('checkbox', { name: `checkrow${0}` }));
    userEvent.click(screen.getByLabelText(`Save`));

    expect(addMembersToGroup).toHaveBeenCalled();
    screen.debug();
  });
});

