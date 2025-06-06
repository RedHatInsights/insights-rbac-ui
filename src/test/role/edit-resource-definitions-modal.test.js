import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import EditResourceDefinitionsModal from '../../smart-components/role/edit-resource-definitions-modal';
import { FETCH_INVENTORY_GROUPS, FETCH_RESOURCE, FETCH_RESOURCE_DEFINITIONS } from '../../redux/action-types';

import * as CostManagementActions from '../../redux/actions/cost-management-actions';
import * as InventoryActions from '../../redux/actions/inventory-actions';
import { render, screen } from '@testing-library/react';

describe('EditResourceDefinitionsModal - Cost management', () => {
  let mockStore;
  let initialState;
  let initialProps;

  const getResourceDefinitionsSpy = jest.spyOn(CostManagementActions, 'fetchResourceDefinitions');
  const getResourceSpy = jest.spyOn(CostManagementActions, 'fetchResource');

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
            {
              resourceDefinitions: [
                {
                  attributeFilter: {
                    key: 'test.test.test',
                    value: '111111',
                    operation: 'equal',
                  },
                },
              ],
              permission: 'cost-management:aws.account:read',
            },
          ],
        },
      },
      costReducer: {
        isLoading: false,
        resourceTypes: {
          meta: { count: 1 },
          data: [
            {
              value: 'aws.account',
              path: '/api/cost-management/v1/resource-types/aws-accounts/',
              count: 2,
            },
          ],
        },
        resources: {
          'aws-accounts': [{ value: '111111' }, { value: '111112' }, { value: '111113' }],
        },
        isLoadingResources: false,
      },
      inventoryReducer: {
        isLoading: false,
        resourceTypes: {},
      },
    };
    initialProps = {
      cancelRoute: '/roles',
    };
  });

  it('should render edit resource definitions modal', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementation(() => ({ type: FETCH_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(screen.getAllByRole('dialog')[0]).toMatchSnapshot();
  });

  it('should show warning modal on cancel with changes and close it', async () => {
    jest.useFakeTimers();
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(() => screen.getByTestId('warning-modal')).toThrow('');

    await act(async () => {
      await screen.getByLabelText('Add all').click();
    });

    await act(async () => {
      screen.getByText('Cancel').click();
    });

    expect(screen.getByTestId('warning-modal')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('Discard').click();
    });

    expect(() => screen.getByTestId('warning-modal')).toThrow('');
  });

  it('should not show warning modal on cancel without changes', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(() => screen.getByTestId('warning-modal')).toThrow('');

    await act(async () => {
      screen.getByText('Cancel').click();
    });
    expect(() => screen.getByTestId('warning-modal')).toThrow('');

    expect(() => screen.getByText('Cancel')).toThrow('');
  });

  it('should show warning modal on close with changes', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(() => screen.getByTestId('warning-modal')).toThrow('');

    await act(async () => {
      await screen.getByLabelText('Remove all').click();
    });

    await act(async () => {
      // Modal close button
      await screen.getByLabelText('Close').click();
    });

    expect(screen.getByTestId('warning-modal')).toBeInTheDocument();
  });

  it('should show alert on removing last resource and cancel', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: FETCH_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    const RDAlertText = 'At least one resource must be defined for this permission';
    expect(() => screen.getByText(RDAlertText)).toThrow();

    await act(async () => {
      await screen.getByLabelText('Remove all').click();
    });
    expect(screen.getByText(RDAlertText)).toBeInTheDocument();
  });
});

describe('EditResourceDefinitionsModal - Inventory', () => {
  let mockStore;
  let initialState;
  let initialProps;

  const getInventoryGroupsSpy = jest.spyOn(InventoryActions, 'fetchInventoryGroups');

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
              resourceDefinitions: [
                {
                  attributeFilter: {
                    key: 'group.in',
                    value: [null, 'test1', 'test2'],
                    operation: 'in',
                  },
                },
              ],
              permission: 'inventory:hosts:read',
            },
          ],
        },
      },
      costReducer: {
        isLoading: false,
        resourceTypes: { data: [] },
        resources: {},
        isLoadingResources: false,
      },
      inventoryReducer: {
        isLoading: false,
        resourceTypes: {
          'inventory:hosts:read': {
            test1: { id: 'test1ID', name: 'test1' },
            test2: { id: 'test2ID', name: 'test2' },
            test3: { id: 'test3ID', name: 'test3' },
            test4: { id: 'test4ID', name: 'test4' },
          },
        },
      },
    };
    initialProps = {
      cancelRoute: '/roles',
    };
  });

  it('should render edit resource definitions modal', async () => {
    getInventoryGroupsSpy.mockImplementationOnce(() => ({ type: FETCH_INVENTORY_GROUPS, payload: Promise.resolve({ data: 'something' }) }));

    await act(async () => {
      render(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/inventory:hosts:read/edit']}>
            <Routes>
              <Route path="/roles/detail/:roleId/permission/:permissionId/edit" element={<EditResourceDefinitionsModal {...initialProps} />} />
            </Routes>
          </MemoryRouter>
        </Provider>,
      );
    });
    expect(screen.getAllByRole('dialog')[0]).toMatchSnapshot();
  });
});
