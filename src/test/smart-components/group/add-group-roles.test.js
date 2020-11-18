import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import AddGroupRoles from '../../../smart-components/group/role/add-group-roles';
import DefaultGroupChange from '../../../smart-components/group/role/default-group-change-modal';

import * as GroupActions from '../../../redux/actions/group-actions';
import { FETCH_GROUPS } from '../../../redux/action-types';

describe('<AddGroupRoles />', () => {
  const addRolesToGroup = jest.fn();
  const addNotification = jest.fn();
  const onDefaultGroupChanged = jest.fn();
  let mockStore;
  let initialState;
  let initialProps;

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
      addRolesToGroup,
    };
    mockStore = configureStore();
  });

  afterEach(() => {
    fetchAddRolesForGroupSpy.mockReset();
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
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
      addNotification,
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
    expect(addNotification).toHaveBeenCalled();
  });

  it('should close AddGroupRoles modal', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let initialProps = {
      selectedRoles: [],
      addNotification,
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
    wrapper.find('button.pf-m-plain').simulate('click');
    expect(addNotification).toHaveBeenCalled();
  });

  it('should submit AddGroupRoles modal', async () => {
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
    expect(addRolesToGroup).toHaveBeenCalled();
  });

  it('should submit AddGroupRoles modal with a default group', async () => {
    fetchAddRolesForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    let wrapper;
    const store = mockStore(initialState);
    let enhancedProps = {
      ...initialProps,
      isDefault: true,
      isChanged: false,
      addRolesToGroup,
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
    expect(wrapper.find(DefaultGroupChange)).toHaveLength(1);
    wrapper.find('input#remove-modal-check').simulate('change');
    wrapper.find('button.pf-m-danger').simulate('click');
    wrapper.update();
    wrapper.find('button.pf-m-primary').simulate('click');
    expect(onDefaultGroupChanged).toHaveBeenCalled();
    expect(wrapper.find(AddGroupRoles)).toHaveLength(1);
  });
});
