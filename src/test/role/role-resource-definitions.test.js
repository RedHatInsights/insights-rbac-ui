import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { FETCH_ROLE } from '../../redux/action-types';
import ResourceDefinitions from '../../smart-components/role/role-resource-definitions';

import * as RoleActions from '../../redux/actions/role-actions';

describe('RoleResourceDefinitions', () => {
  let mockStore;
  let initialState;

  const fetchRoleSpy = jest.spyOn(RoleActions, 'fetchRole');

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      roleReducer: {
        isRecordLoading: false,
        selectedRole: {
          uuid: '1234',
          display_name: 'name',
          description: 'description',
          access: [
            {
              resourceDefinitions: Array(21).fill({
                attributeFilter: {
                  key: 'test.test.test',
                  value: 'test',
                  operation: 'equal',
                },
              }),
              permission: 'cost-management:*:read',
            },
          ],
        },
      },
    };
  });

  it('should render resource definitions table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId" element={<ResourceDefinitions />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    expect(screen.getByLabelText('resources table')).toMatchSnapshot();
  });

  it('should not fetch data on filter', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    const store = mockStore(initialState);
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId" element={<ResourceDefinitions />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedActions = [expect.objectContaining({ type: FETCH_ROLE })];
    expect(store.getActions()).toEqual(expectedActions);
    store.clearActions();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Filter by {key}'), { target: { value: 'c' } });
    });
    expect(store.getActions()).toEqual([]);
  });

  it('should not fetch data on page change', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    const store = mockStore(initialState);
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId" element={<ResourceDefinitions />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedActions = [expect.objectContaining({ type: FETCH_ROLE })];
    expect(store.getActions()).toEqual(expectedActions);
    store.clearActions();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to last page'));
    });
    expect(store.getActions()).toEqual([]);
  });
});
