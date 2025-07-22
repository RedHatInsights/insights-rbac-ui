import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, render, screen } from '@testing-library/react';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import MUARolesTable from '../../../features/myUserAccess/MUARolesTable';
import { createFilter } from '../../../features/myUserAccess/CommonBundleView';
import * as RoleActions from '../../../redux/roles/actions';
import { FETCH_ROLE_FOR_PRINCIPAL, FETCH_ROLES } from '../../../redux/roles/action-types';

/**
 * Mock debounce to remove tomers shenanigans
 */
import debouce from 'lodash/debounce';
import PropTypes from 'prop-types';

jest.mock('lodash/debounce');
debouce.mockImplementation((fn) => fn);

const ContextWrapper = ({ children, store, initialEntries = ['/foo?bundle="bundle"'] }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  </Provider>
);
ContextWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  store: PropTypes.object.isRequired,
  initialEntries: PropTypes.arrayOf(PropTypes.string),
};

ContextWrapper.defaultProps = {
  initialEntries: ['/foo?bundle="bundle"'],
};

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
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>,
      );
    });

    expect(screen.getAllByRole('row')).toHaveLength(2 + 1); // +1 for header
  });

  it('should expand row and fetch data for nested roles table', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock);
    fetchRoleForPrincipalSpy.mockImplementationOnce(() => roleForPrincipalMock);
    await act(async () => {
      await render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>,
      );
    });

    expect(screen.getAllByRole('row')).toHaveLength(2 + 1); // +1 for header
    /**
     * expand table row
     */
    await act(async () => {
      await fireEvent.click(screen.getByText(2));
    });

    expect(screen.getAllByRole('row')).toHaveLength(2 + 1 + 3); // +1 for header, +e for the expandable table and its rows (1 new row for table, 1 for new table header, 1 for the table data rows)

    /**
     * Close row
     */
    await act(async () => {
      await fireEvent.click(screen.getByText(2));
    });

    expect(screen.getAllByRole('row')).toHaveLength(2 + 1); // +1 for header
  });

  it('should render nested table with RD column and open modal', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock);
    fetchRoleForPrincipalSpy.mockImplementationOnce(() => roleForPrincipalMock);
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>,
      );
    });

    /**
     * expand table row
     */
    await act(async () => {
      await fireEvent.click(screen.getByText(2));
    });
    expect(screen.getAllByText(1, { selector: 'a' })).toHaveLength(1);

    expect(() =>
      screen.getByText('Resource definitions', {
        selector: '.pf-v5-c-modal-box__title-text',
      }),
    ).toThrow();
    await act(async () => {
      fireEvent.click(screen.getByText(1, { selector: 'a' }));
    });
    /**
     * We need this double update to trigger the react lazy/Suspense interaction
     */
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText('Resource definitions', {
        selector: '.pf-v5-c-modal-box__title-text',
      }),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('Close'));
    });
    expect(() =>
      screen.getByText('Resource definitions', {
        selector: '.pf-v5-c-modal-box__title-text',
      }),
    ).toThrow();
  });

  it('should filter roles by application', async () => {
    jest.useFakeTimers();
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: true });
    fetchRolesSpy.mockImplementationOnce(() => rolesMock).mockImplementationOnce(() => rolesMock);
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUARolesTable filters={filters} {...initialProps} />
        </ContextWrapper>,
      );
    });
    await act(async () => {
      jest.runAllTimers();
    });

    act(() => {
      // click on a element with Filter by {key} text
      screen.getByText('Filter by {key}').click();
    });

    act(() => {
      // click on a second checkbox
      screen.getAllByRole('checkbox')[1].click();
    });
    /**
     * Skip debounce
     */
    await act(async () => {
      await jest.runOnlyPendingTimers();
    });
    expect(fetchRolesSpy).toHaveBeenCalledTimes(2);
    expect(fetchRolesSpy.mock.calls).toEqual([
      [{ application: 'app1,app2', limit: 20, offset: 0, scope: 'principal', orderBy: 'display_name' }],
      [
        {
          application: 'app2',
          limit: undefined,
          name: '',
          offset: 0,
          permission: undefined,
          scope: 'principal',
          orderBy: 'display_name',
        },
      ],
    ]);
  });
});
