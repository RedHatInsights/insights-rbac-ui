import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import MUARolesTable from '../../../smart-components/myUserAccess/MUARolesTable';
import { createFilter } from '../../../smart-components/myUserAccess/CommonBundleView';
import * as RoleActions from '../../../redux/actions/role-actions';
import { FETCH_ROLES, FETCH_ROLE_FOR_PRINCIPAL } from '../../../redux/action-types';
import { RowWrapper } from '@patternfly/react-table';
import ResourceDefinitionsLink from '../../../presentational-components/myUserAccess/ResourceDefinitionsLink';
import { Modal } from '@patternfly/react-core';

/**
 * Mock debounce to remove tomers shenanigans
 */
import debouce from 'lodash/debounce';
jest.mock('lodash/debounce');
debouce.mockImplementation((fn) => fn);

const ContextWrapper = ({ children, store, initialEntries = ['/foo?bundle="bundle"'] }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  </Provider>
);

describe('<MUARolesTable />', () => {
  const mockStore = configureStore([thunk, promiseMiddleware, notificationsMiddleware()]);

  const initialProps = {
    setFilters: jest.fn(),
    apps: ['app1', 'app2'],
    showResourceDefinitions: false,
  };

  const initialState = {
    roleReducer: {
      roles: {
        meta: {},
        data: [
          {
            uuid: '1',
            name: 'first-role',
            description: 'first role desc',
            accessCount: 0,
          },
          {
            uuid: '2',
            name: 'second-role',
            description: 'second role desc',
            accessCount: 2,
          },
        ],
      },
      isLoading: false,
      rolesWithAccess: {
        2: {
          access: [
            {
              permission: 'first:first:first',
              resourceDefinitions: [
                {
                  attributeFilter: {
                    value: 'bar',
                  },
                },
              ],
            },
          ],
        },
      },
    },
  };

  const rolesMock = {
    type: FETCH_ROLES,
    payload: Promise.resolve({
      data: [],
      meta: {},
    }),
  };

  const roleForPrincipalMock = {
    type: FETCH_ROLE_FOR_PRINCIPAL,
    payload: Promise.resolve({
      data: [],
      meta: {},
    }),
  };

  const fetchRolesSpy = jest.spyOn(RoleActions, 'fetchRoles');
  const fetchRoleForPrincipalSpy = jest.spyOn(RoleActions, 'fetchRoleForPrincipal');
  afterEach(() => {
    fetchRolesSpy.mockReset();
    fetchRoleForPrincipalSpy.mockReset();
  });

  it('should load data and render table', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>
      );
    });
    wrapper.update();

    /**
     * There is 5 rows because
     * Two for data
     * Two more hidden expandable tables
     * One for access table
     */
    expect(wrapper.find(RowWrapper)).toHaveLength(5);
  });

  it('should expand row and fetch data for nested roles table', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock);
    fetchRoleForPrincipalSpy.mockImplementationOnce(() => roleForPrincipalMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>
      );
    });
    wrapper.update();
    expect(wrapper.find(RowWrapper).at(3).prop('row').isExpanded).toEqual(false);
    /**
     * expand table row
     */
    act(() => {
      wrapper.find(RowWrapper).at(2).find('button.pf-c-table__button').prop('onClick')();
    });
    wrapper.update();
    expect(wrapper.find(RowWrapper).at(3).prop('row').isExpanded).toEqual(true);

    /**
     * Close row
     */
    act(() => {
      wrapper.find(RowWrapper).at(2).find('button.pf-c-table__button').prop('onClick')();
    });
    /**
     * expand table row second time should not trigger API call
     */
    act(() => {
      wrapper.find(RowWrapper).at(2).find('button.pf-c-table__button').prop('onClick')();
    });
    expect(fetchRoleForPrincipalSpy).toHaveBeenCalledTimes(1);
  });

  it('should render nested table with RD column and open modal', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock);
    fetchRoleForPrincipalSpy.mockImplementationOnce(() => roleForPrincipalMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>
      );
    });
    wrapper.update();

    /**
     * expand table row
     */
    act(() => {
      wrapper.find(RowWrapper).at(2).find('button.pf-c-table__button').prop('onClick')();
    });
    wrapper.update();
    expect(wrapper.find(ResourceDefinitionsLink)).toHaveLength(1);
    expect(wrapper.find(Modal)).toHaveLength(0);
    await act(async () => {
      wrapper.find(ResourceDefinitionsLink).prop('onClick')();
    });
    /**
     * We nned this double update to trigger the react lazy/Suspense interaction
     */
    await act(async () => {
      wrapper.update();
    });
    wrapper.update();
    expect(wrapper.find(Modal)).toHaveLength(1);
    act(() => {
      wrapper.find(Modal).prop('onClose')();
    });
    wrapper.update();
    expect(wrapper.find(Modal)).toHaveLength(0);
  });

  it('should filter roles by application', async () => {
    jest.useFakeTimers();
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock).mockImplementationOnce(() => rolesMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>
      );
    });
    jest.runAllTimers();
    wrapper.update();
    wrapper.find('button.pf-c-select__toggle').prop('onClick')();
    wrapper.update();
    /**
     * Select last option in applications select
     */
    wrapper.find('input.pf-c-check__input').last().prop('onChange')();
    /**
     * Skip debounce
     */
    wrapper.update();
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchRolesSpy).toHaveBeenCalledTimes(2);
    expect(fetchRolesSpy.mock.calls).toEqual([
      [{ application: 'app1,app2', limit: 20, offset: 0, scope: 'principal', orderBy: 'display_name' }],
      [{ application: 'app2', limit: undefined, name: '', offset: 0, permission: undefined, scope: 'principal', orderBy: 'display_name' }],
    ]);
  });
});
