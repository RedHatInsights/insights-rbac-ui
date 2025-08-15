import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import RemoveRoleModal from '../../smart-components/role/remove-role-modal';

import * as RoleHelper from '../../helpers/role/role-helper';
import * as RoleActions from '../../redux/actions/role-actions';
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

describe('<RemoveRoleModal />', () => {
  const ROLE_ID = 'foo';
  const initialProps = {
    routeMatch: '/role/:roleId',
    cancelRoute: '/cancel',
    afterSubmit: jest.fn(),
  };
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const mockStore = configureStore(middlewares);

  const fetchRoleSpy = jest.spyOn(RoleHelper, 'fetchRole');
  const removeRoleSpy = jest.spyOn(RoleActions, 'removeRole');

  afterEach(() => {
    fetchRoleSpy.mockReset();
    removeRoleSpy.mockReset();
  });

  const ComponentWrapper = ({ store, children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/role/${ROLE_ID}`]}>
        <Routes>
          <Route path="/role/:roleId" element={children} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  ComponentWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    store: PropTypes.object.isRequired,
  };
  it('should mount and call remove role action without fetching data from API', async () => {
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: ROLE_ID,
          display_name: 'role-name',
        },
      },
    });
    removeRoleSpy.mockImplementationOnce(() => ({ type: 'REMOVE_ROLE', payload: Promise.resolve() }));

    render(
      <ComponentWrapper store={store}>
        <RemoveRoleModal {...initialProps} />
      </ComponentWrapper>,
    );

    await act(async () => {
      await fireEvent.click(screen.getByText('I understand that this action cannot be undone'));
    });

    act(() => {
      screen.getByText('Delete role').click();
    });

    expect(removeRoleSpy).toHaveBeenCalledTimes(1);
    expect(removeRoleSpy).toHaveBeenCalledWith(ROLE_ID);
    expect(fetchRoleSpy).not.toHaveBeenCalled();
  });

  it('should mount and fetch data from API when not available in redux store', async () => {
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
          <RemoveRoleModal {...initialProps} />
        </ComponentWrapper>,
      );
    });

    expect(fetchRoleSpy).toHaveBeenCalledTimes(1);
    expect(fetchRoleSpy).toHaveBeenCalledWith(ROLE_ID);
  });
});
