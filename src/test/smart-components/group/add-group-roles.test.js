import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { fireEvent, prettyDOM, render, screen, waitFor } from '@testing-library/react';
import * as GroupActions from '../../../redux/actions/group-actions';
import AddGroupRoles from '../../../smart-components/group/role/add-group-roles';
import { FETCH_GROUPS } from '../../../redux/action-types';

describe('<AddGroupRoles />', () => {
  const setSelectedRoles = jest.fn();
  const onDefaultGroupChanged = jest.fn();
  let mockStore;
  let initialState;
  let initialProps;

  const addRolesToGroupSpy = jest.spyOn(GroupActions, 'addRolesToGroup');
  const fetchAddRolesForGroupSpy = jest.spyOn(GroupActions, 'fetchAddRolesForGroup');
  beforeEach(() => {
    initialState = {
      groupReducer: {
        selectedGroup: {
          addRoles: {
            pagination: {
              count: 175,
              limit: 10,
              offset: 0,
            },
          },
          uuid: '1234',
          name: 'Custom default access',
          system: false,
          roles: [],
        },
      },
    };
    initialProps = {
      selectedRoles: [{ uuid: 'dd1408bd-662a-49b7-b483-e3871bb6030b' }],
      setSelectedRoles: setSelectedRoles,
      addRolesToGroup: addRolesToGroupSpy,
    };
    mockStore = configureStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render AddGroupRoles modal', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let initialProps = { selectedRoles: [], setSelectedRoles: jest.fn() };

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Add roles to the {name} group')).toBeInTheDocument();
    expect(screen.getByText('This role list has been filtered to only show roles that are not currently in your group.')).toBeInTheDocument();
    expect(screen.getByText('Add to group')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(fetchAddRolesForGroupSpy).toHaveBeenCalledTimes(1);
  });

  test('should cancel adding roles', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
      setSelectedRoles: jest.fn(),
    };

    const expectedPayload = [
      expect.objectContaining({
        type: 'FETCH_GROUPS',
      }),
      expect.objectContaining({
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
        payload: expect.objectContaining({
          description: 'Adding roles to group was canceled by the user.',
          dismissDelay: 8000,
          title: 'Adding roles to group',
          variant: 'warning',
        }),
      }),
    ];

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(store.getActions()).toEqual(expectedPayload);
  });

  test('should close AddGroupRoles modal', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
      setSelectedRoles: jest.fn(),
    };

    const expectedPayload = [
      expect.objectContaining({
        type: 'FETCH_GROUPS',
      }),
      expect.objectContaining({
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
        payload: expect.objectContaining({
          description: 'Adding roles to group was canceled by the user.',
          dismissDelay: 8000,
          title: 'Adding roles to group',
          variant: 'warning',
        }),
      }),
    ];

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(store.getActions()).toEqual(expectedPayload);
  });

  test('should submit AddGroupRoles modal', async () => {
    addRolesToGroupSpy.mockImplementationOnce(() => Promise.resolve({ then: jest.fn() }));
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);

    const expectedPayload = [
      expect.objectContaining({
        type: 'FETCH_GROUPS',
      }),
    ];

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Add to group'));
    expect(addRolesToGroupSpy).toHaveBeenCalled();
    expect(setSelectedRoles).toHaveBeenCalled();
    expect(store.getActions()).toEqual(expectedPayload);
  });

  test('should submit AddGroupRoles modal with a default group', async () => {
    addRolesToGroupSpy.mockImplementationOnce(() => Promise.resolve({ then: jest.fn() }));
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let enhancedProps = {
      ...initialProps,
      isDefault: true,
      isChanged: false,
      addRolesToGroup: addRolesToGroupSpy,
      onDefaultGroupChanged,
      setSelectedRoles,
      title: 'test',
    };

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...enhancedProps} />} />
        </MemoryRouter>
      </Provider>
    );

    const expectedPayload = [
      expect.objectContaining({
        type: 'FETCH_GROUPS',
      }),
    ];

    expect(screen.getByText('Add roles to the {name} group')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Add to group'));
    waitFor(() => expect(screen.getByText('Add roles to the {name} group')).not.toBeInTheDocument());
    waitFor(() =>
      expect(
        screen.getByText(
          'Once you edit the Default access group, the system will no longer update it with new default access roles. The group name will change to Custom default access.'
        )
      ).toBeInTheDocument()
    );
    waitFor(() => expect(screen.getByText('I understand, and I want to continue.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onDefaultGroupChanged).toHaveBeenCalled();
    expect(addRolesToGroupSpy).toHaveBeenCalled();
    expect(setSelectedRoles).toHaveBeenCalled();
    expect(store.getActions()).toEqual(expectedPayload);
  });

  test('should cancel default group warning modal', async () => {
    addRolesToGroupSpy.mockImplementationOnce(() => Promise.resolve({ then: jest.fn() }));
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let enhancedProps = {
      ...initialProps,
      isDefault: true,
      isChanged: false,
      addRolesToGroup: addRolesToGroupSpy,
      onDefaultGroupChanged,
      setSelectedRoles,
      title: 'test',
    };
    const expectedPayload = [
      expect.objectContaining({
        type: 'FETCH_GROUPS',
      }),
      expect.objectContaining({
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
        payload: expect.objectContaining({
          description: 'Adding roles to group was canceled by the user.',
          dismissDelay: 8000,
          title: 'Adding roles to group',
          variant: 'warning',
        }),
      }),
    ];

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123']}>
          <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...enhancedProps} />} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Add to group'));
    expect(screen.getByText('I understand, and I want to continue.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(addRolesToGroupSpy).not.toHaveBeenCalled();
    expect(setSelectedRoles).toHaveBeenCalled();
    expect(store.getActions()).toEqual(expectedPayload);
  });
});
