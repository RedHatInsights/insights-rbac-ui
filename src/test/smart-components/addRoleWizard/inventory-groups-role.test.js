import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore, { MockStore } from 'redux-mock-store';
import userEvent from '@testing-library/user-event';
import InventoryGroupsRole from '../../../smart-components/role/add-role/inventory-groups-role';
import * as inventoryActions from '../../../redux/actions/inventory-actions';
import * as groupActions from '../../../redux/actions/group-actions';
// import { FETCH_INVENTORY_GROUP } from '../../../redux/action-types'
// import { fetchGroup } from '../../../helpers/group/group-helper';
import { BrowserRouter } from 'react-router-dom';
import { testInventoryGroups } from './inventory-groups-test-data';

const mockStore = configureMockStore();

const initialState = {
  inventoryReducer: {
      isLoading: false,
      loadingResources: 0,
      resourceTypes: {
          data: [],
      },
  },
  meta: {
    limit: 20,
    offset: 0,
    itemCount: 0,
  },
};

const initialStateWithPermissions = {
    inventoryReducer: {
        isLoading: false,
        loadingResources: 0,
        resourceTypes: {
            data: testInventoryGroups,
        },
    },
};

const renderComponent = (store) => {
    return render(
        <React.Fragment>
            <Provider store={store}>
                <BrowserRouter>
                    <InventoryGroupsRole />
                </BrowserRouter>
            </Provider>
        </React.Fragment>
    );
}

describe('Inventory groups role', () => {
    let store = mockStore(initialStateWithPermissions);
    
    test('Add permissions to group renders without failing', () => {
        const renderedResults = renderComponent(store);
        expect(renderedResults.getByText('Review details').toBeInTheDocument());
    });

    test('Clicking on the dropdown pulls the groups pulled by fetchGroups', async () => {
        const store = mockStore(initialStateWithPermissions); 
        let fetchGroups;
        
        const renderedResult = renderComponent(store);
        const dropdowns = renderedResult.getAllByRole('dropdown');
        
        await act(async () => {
            expect(renderedResult.getByText('fooBar'))
        })
    });
});
