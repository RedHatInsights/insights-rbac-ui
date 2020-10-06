import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as RoleHelper from '../../helpers/role/role-helper';
import * as RoleActions from '../../redux/actions/role-actions';
import EditRoleModal from '../../smart-components/role/edit-role-modal';
import { FormGroup } from '@patternfly/react-core';

describe('<EditRoleModal />', () => {
  const ROLE_ID = 'foo';
  const initialProps = {
    routeMatch: '/role/:id',
    cancelRoute: '/cancel',
    afterSubmit: jest.fn(),
  };
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const mockStore = configureStore(middlewares);

  const fetchRoleSpy = jest.spyOn(RoleHelper, 'fetchRole');
  const fetchRolesSpy = jest.spyOn(RoleHelper, 'fetchRoles');
  const updateRoleSpy = jest.spyOn(RoleActions, 'updateRole');

  afterEach(() => {
    fetchRoleSpy.mockReset();
    updateRoleSpy.mockReset();
    fetchRolesSpy.mockReset();
  });

  const ComponentWrapper = ({ store, children }) => (
    <MemoryRouter initialEntries={[`/role/${ROLE_ID}`]}>
      <Route path="/role/:id">
        <Provider store={store}>{children}</Provider>
      </Route>
    </MemoryRouter>
  );

  it('should mount and call update role action witouth fethichg data from API', async () => {
    expect.assertions(4);
    jest.useFakeTimers();
    const afterSubmit = jest.fn();
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: ROLE_ID,
          name: 'role-name',
          description: 'bar',
        },
      },
    });
    updateRoleSpy.mockImplementationOnce(() => ({ type: 'UPDATE_ROLE', payload: Promise.resolve() }));
    /**
     * Async name validation
     */
    fetchRolesSpy.mockImplementation(() => Promise.resolve({ data: [] }));

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ComponentWrapper store={store}>
          <EditRoleModal {...initialProps} afterSubmit={afterSubmit} />
        </ComponentWrapper>
      );
    });

    wrapper.update();

    const textArea = wrapper.find('textarea[name="description"]');
    textArea.getDOMNode().value = 'foo';
    textArea.simulate('change');

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });
    wrapper.update();

    /**
     * Submit form
     */
    await act(async () => {
      wrapper.find('form').simulate('submit');
    });

    expect(updateRoleSpy).toHaveBeenCalledTimes(1);
    expect(updateRoleSpy).toHaveBeenCalledWith(ROLE_ID, { description: 'foo', name: 'role-name', display_name: 'role-name', uuid: 'foo' });
    expect(fetchRoleSpy).not.toHaveBeenCalled();
    expect(afterSubmit).toHaveBeenCalledWith();
  });

  it('should mount and fetch data from API when not avaiable in redux store', async () => {
    expect.assertions(2);
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: 'nonsense',
        },
      },
    });
    fetchRoleSpy.mockImplementation(() => Promise.resolve({ uuid: ROLE_ID, name: 'name' }));

    await act(async () => {
      mount(
        <ComponentWrapper store={store}>
          <EditRoleModal {...initialProps} />
        </ComponentWrapper>
      );
    });

    expect(fetchRoleSpy).toHaveBeenCalledTimes(1);
    expect(fetchRoleSpy).toHaveBeenCalledWith(ROLE_ID);
  });

  it('should display an error when role name is not unique', async () => {
    expect.assertions(2);
    jest.useFakeTimers();
    const afterSubmit = jest.fn();
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: ROLE_ID,
          name: 'role-name',
          description: 'bar',
        },
      },
    });
    updateRoleSpy.mockImplementationOnce(() => ({ type: 'UPDATE_ROLE', payload: Promise.resolve() }));
    /**
     * Async name validation
     */
    fetchRolesSpy.mockImplementation(() => Promise.resolve({ data: [{ name: 'new-name', uuid: 'bar' }] }));

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ComponentWrapper store={store}>
          <EditRoleModal {...initialProps} afterSubmit={afterSubmit} />
        </ComponentWrapper>
      );
    });

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });
    wrapper.update();

    const input = wrapper.find('input[name="name"]');
    input.getDOMNode().value = 'new-name';
    input.simulate('change');

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });
    /**
     * Loose focus to trigger error render
     */
    input.simulate('blur');
    wrapper.update();

    const TextInputGroup = wrapper.find(FormGroup).first();
    expect(TextInputGroup.prop('validated')).toEqual('error');
    expect(TextInputGroup.prop('helperTextInvalid')).toEqual('Role with this name already exists.');
  });
});
