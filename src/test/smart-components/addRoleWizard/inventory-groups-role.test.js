import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import InventoryGroupsRole from '../../../features/roles/add-role/inventory-groups-role';
import { testInventoryGroups } from './inventory-groups-test-data';
import * as InventoryActions from '../../../redux/inventory/actions';
import { FETCH_INVENTORY_GROUPS } from '../../../redux/inventory/action-types';

const initialStateWithPermissions = {
  inventoryReducer: {
    isLoading: false,
    resourceTypes: {
      'inventory:hosts:read': testInventoryGroups.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {}),
      'inventory:hosts:write': testInventoryGroups.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {}),
    },
    total: testInventoryGroups.length,
  },
};

jest.mock('@data-driven-forms/react-form-renderer/use-form-api', () => {
  return {
    __esModule: true,
    default: () => ({
      getState: jest.fn().mockReturnValue({
        values: {
          'add-permissions-table': [
            {
              uuid: 'inventory:hosts:read',
              requires: [],
            },
            {
              uuid: 'inventory:groups:write',
              requires: [],
            },
          ],
          'role-description': 'Be able to read and edit Account Staleness and Culling data.',
          'role-name': 'Account Staleness and Culling Administrator',
          'role-type': 'create',
          'role-uuid': '218ed86a-08f9-4d5d-aeac-7539eed882cd',
        },
      }),
      change: jest.fn(),
    }),
  };
});

jest.mock('@data-driven-forms/react-form-renderer/use-field-api', () => {
  return {
    __esModule: true,
    default: () => ({
      input: {
        value: ['inventory:hosts:read', 'inventory:groups:write'],
        name: 'inventory-groups-role',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        onFocus: jest.fn(),
      },
    }),
  };
});

jest.mock('@unleash/proxy-client-react', () => ({
  __esModule: true,
  useFlag: () => true,
}));

const renderComponent = (store) => {
  return render(
    <React.Fragment>
      <Provider store={store}>
        <BrowserRouter>
          <InventoryGroupsRole />
        </BrowserRouter>
      </Provider>
    </React.Fragment>,
  );
};

describe('Inventory groups role', () => {
  let mockStore;

  const fetchInventoryGroupsSpy = jest.spyOn(InventoryActions, 'fetchInventoryGroups');

  beforeEach(() => {
    mockStore = configureStore();
  });

  afterEach(() => {
    fetchInventoryGroupsSpy.mockReset();
  });

  test('Add permissions to group renders without failing', async () => {
    fetchInventoryGroupsSpy.mockImplementationOnce(() => ({
      type: FETCH_INVENTORY_GROUPS,
      payload: Promise.resolve({}),
    }));
    const store = mockStore(initialStateWithPermissions);

    const renderedResults = renderComponent(store);

    expect(renderedResults.getByText('Permissions')).toBeInTheDocument();
    expect(renderedResults.asFragment()).toMatchSnapshot();
  });

  test('Display available permission groups successfully', async () => {
    fetchInventoryGroupsSpy.mockImplementationOnce(() => ({
      type: FETCH_INVENTORY_GROUPS,
      payload: Promise.resolve({}),
    }));

    const store = mockStore(initialStateWithPermissions);
    renderComponent(store);

    fireEvent.click(screen.getAllByLabelText('Select workspaces to add permissions for')[0]);

    expect(screen.getByText('fooBar')).toBeInTheDocument();
  });

  test('Selecting group for permission and Copy to all to other permissions successfully', async () => {
    fetchInventoryGroupsSpy.mockImplementationOnce(() => ({
      type: FETCH_INVENTORY_GROUPS,
      payload: Promise.resolve({}),
    }));

    const store = mockStore(initialStateWithPermissions);
    const renderedResults = renderComponent(store);

    fireEvent.click(screen.getAllByLabelText('Select workspaces to add permissions for')[0]);
    expect(screen.getByText('fooBar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('fooBar'));

    const badgesAfterSelection = screen.getAllByText('1', { selector: '.pf-v5-c-badge' });
    expect(badgesAfterSelection).toHaveLength(1);

    // Opening the second groups selection
    fireEvent.click(renderedResults.getByText('Copy to all'));
    expect(screen.getAllByLabelText('Select workspaces to add permissions for')[1]);
    fireEvent.click(screen.getAllByLabelText('Select workspaces to add permissions for')[1]);

    const badgesAfterCopyAll = screen.getAllByText('1', { selector: '.pf-v5-c-badge' });
    expect(badgesAfterCopyAll).toHaveLength(2);
  });

  test('Cancelling groups selection clears selections successfully', async () => {
    fetchInventoryGroupsSpy.mockImplementationOnce(() => ({
      type: FETCH_INVENTORY_GROUPS,
      payload: Promise.resolve({}),
    }));

    const store = mockStore(initialStateWithPermissions);
    const renderedResults = renderComponent(store);

    fireEvent.click(screen.getAllByLabelText('Select workspaces to add permissions for')[0]);
    expect(renderedResults.getByText('fooBar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('fooBar'));

    const badgesBeforeClear = screen.getAllByText('1', { selector: '.pf-v5-c-badge' });
    expect(badgesBeforeClear).toHaveLength(1);

    await waitFor(() => {
      const clearButton = screen.getByLabelText('Clear all');
      expect(clearButton).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Clear all'));

    const badgesAfterClear = screen.queryAllByLabelText('Clear all');
    expect(badgesAfterClear).toHaveLength(0);
  });
});
