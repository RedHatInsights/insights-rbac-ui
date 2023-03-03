import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import * as ReactRedux from 'react-redux';
import { Provider } from 'react-redux';
import * as GroupActions from '../../../redux/actions/group-actions';
import AddGroupRoles from '../../../smart-components/group/role/add-group-roles';
import DefaultGroupChange from '../../../smart-components/group/role/default-group-change-modal';
import { FETCH_GROUPS } from '../../../redux/action-types';

describe('<AddGroupRoles />', () => {
  const setSelectedRoles = jest.fn();
  const onDefaultGroupChanged = jest.fn();
  const dispatch = jest.fn();
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
    fetchAddRolesForGroupSpy.mockReset();
    addRolesToGroupSpy.mockReset();
  });

  it('should render AddGroupRoles modal', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let initialProps = { selectedRoles: [] };
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123']}>
            <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find(AddGroupRoles)).toHaveLength(1);
    expect(fetchAddRolesForGroupSpy).toHaveBeenCalledTimes(1);
  });

  it('should cancel adding roles', async () => {
    jest.spyOn(ReactRedux, 'useDispatch').mockImplementationOnce(() => dispatch);
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
    };
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123']}>
            <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    wrapper.find('button.pf-m-link').simulate('click');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          description: 'Adding roles to group was canceled by the user.',
          dismissDelay: 8000,
          title: 'Adding roles to group',
          variant: 'warning',
        }),
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
      })
    );
  });

  it('should close AddGroupRoles modal', async () => {
    jest.spyOn(ReactRedux, 'useDispatch').mockImplementationOnce(() => dispatch);
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
    };
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123']}>
            <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    wrapper.find('button.pf-m-plain').first().simulate('click');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          description: 'Adding roles to group was canceled by the user.',
          dismissDelay: 8000,
          title: 'Adding roles to group',
          variant: 'warning',
        }),
        type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION',
      })
    );
  });

  it('should submit AddGroupRoles modal', async () => {
    addRolesToGroupSpy.mockImplementationOnce(() => Promise.resolve({ then: jest.fn() }));
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123']}>
            <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...initialProps} />} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    wrapper.find('button.pf-m-primary').simulate('click');
    expect(addRolesToGroupSpy).toHaveBeenCalled();
    expect(setSelectedRoles).toHaveBeenCalled();
  });

  it('should submit AddGroupRoles modal with a default group', async () => {
    addRolesToGroupSpy.mockImplementationOnce(() => Promise.resolve({ then: jest.fn() }));
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let enhancedProps = {
      ...initialProps,
      isDefault: true,
      isChanged: false,
      addRolesToGroup: addRolesToGroupSpy,
      onDefaultGroupChanged,
      title: 'test',
    };
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/123']}>
            <Route path="/groups/detail/:uuid" render={(props) => <AddGroupRoles {...props} {...enhancedProps} />} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find(AddGroupRoles)).toHaveLength(1);
    wrapper.find('input#roles-list-toggle-checkbox').simulate('change');
    wrapper.find('button.pf-m-primary').simulate('click');
    wrapper.update();
    expect(wrapper.find(DefaultGroupChange)).toHaveLength(1);
    wrapper.find('input#remove-modal-check').simulate('change');
    wrapper.find('button.pf-m-danger').simulate('click');
    expect(onDefaultGroupChanged).toHaveBeenCalled();
    expect(addRolesToGroupSpy).toHaveBeenCalled();
    expect(setSelectedRoles).toHaveBeenCalled();
  });
});
