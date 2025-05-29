import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import * as RoleHelper from '../../helpers/role/role-helper';
import * as RoleActions from '../../redux/actions/role-actions';
import EditRoleModal from '../../smart-components/role/edit-role-modal';
import PropTypes from 'prop-types';

jest.mock('../../helpers/role/role-helper', () => {
  const actual = jest.requireActual('../../helpers/role/role-helper');
  return {
    __esModule: true,
    ...actual,
  };
});

jest.mock('../../redux/actions/role-actions', () => {
  const actual = jest.requireActual('../../redux/actions/role-actions');
  return {
    __esModule: true,
    ...actual,
  };
});

describe('<EditRoleModal />', () => {
  const ROLE_ID = 'foo';
  const initialProps = {
    routeMatch: '/role/:roleId',
    cancelRoute: '/cancel',
    afterSubmit: jest.fn(),
  };
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const mockStore = configureStore(middlewares);

  const fetchRoleSpy = jest.spyOn(RoleHelper, 'fetchRole');
  const fetchRolesSpy = jest.spyOn(RoleHelper, 'fetchRoles');
  const patchRoleSpy = jest.spyOn(RoleActions, 'patchRole');

  afterEach(() => {
    fetchRoleSpy.mockReset();
    patchRoleSpy.mockReset();
    fetchRolesSpy.mockReset();
  });

  const ComponentWrapper = ({ store, children }) => (
    <MemoryRouter initialEntries={[`/role/${ROLE_ID}`]}>
      <Provider store={store}>{children}</Provider>
    </MemoryRouter>
  );
  ComponentWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    store: PropTypes.object.isRequired,
  };
  it('should mount and call update role action without fethichg data from API', async () => {
    expect.assertions(4);
    jest.useFakeTimers();
    const afterSubmit = jest.fn();
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: ROLE_ID,
          name: 'role-name',
          display_name: 'role-name',
          description: 'bar',
        },
      },
    });
    patchRoleSpy.mockImplementationOnce(() => ({ type: 'PATCH_ROLE', payload: Promise.resolve() }));
    /**
     * Async name validation
     */
    fetchRolesSpy.mockImplementation(() => Promise.resolve({ data: [] }));

    await act(async () => {
      render(
        <ComponentWrapper store={store}>
          <Routes>
            <Route path="/role/:roleId" element={<EditRoleModal {...initialProps} afterSubmit={afterSubmit} />} />
          </Routes>
        </ComponentWrapper>,
      );
    });

    const textArea = screen.getByRole('textbox', { name: /description/i });
    await act(async () => {
      await fireEvent.change(textArea, { target: { value: 'foo' } });
    });

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });

    /**
     * Submit form
     */
    await act(async () => {
      await fireEvent.click(screen.getByText('Save'));
    });

    expect(patchRoleSpy).toHaveBeenCalledTimes(1);
    expect(patchRoleSpy).toHaveBeenCalledWith(ROLE_ID, {
      description: 'foo',
      name: 'role-name',
      display_name: 'role-name',
    });
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
      render(
        <ComponentWrapper store={store}>
          <Routes>
            <Route path="/role/:roleId" element={<EditRoleModal {...initialProps} />} />
          </Routes>
        </ComponentWrapper>,
      );
    });

    expect(fetchRoleSpy).toHaveBeenCalledTimes(1);
    expect(fetchRoleSpy).toHaveBeenCalledWith(ROLE_ID);
  });

  it('should display an error when role name is not unique', async () => {
    expect.assertions(1);
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
    patchRoleSpy.mockImplementationOnce(() => ({ type: 'PATCH_ROLE', payload: Promise.resolve() }));
    /**
     * Async name validation
     */
    fetchRolesSpy.mockImplementation(() => Promise.resolve({ data: [{ display_name: 'new-name', uuid: 'bar' }] }));

    await act(async () => {
      render(
        <ComponentWrapper store={store}>
          <Routes>
            <Route path="/role/:roleId" element={<EditRoleModal {...initialProps} afterSubmit={afterSubmit} />} />
          </Routes>
        </ComponentWrapper>,
      );
    });

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });

    const input = screen.getByRole('textbox', { name: /name/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'new-name' } });
    });

    /**
     * advance async validation debounce timeout and update the DOM to enable submit button
     */
    await act(async () => {
      jest.runAllTimers();
    });
    /**
     * Loose focus to trigger error render
     */
    act(() => {
      fireEvent.blur(input);
    });

    expect(screen.getByText('Role with this name already exists.')).toBeInTheDocument();
  });
});
