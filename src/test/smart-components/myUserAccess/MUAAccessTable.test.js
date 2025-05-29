import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, render, screen } from '@testing-library/react';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import MUAAccessTable from '../../../smart-components/myUserAccess/MUAAccessTable';
import * as AccessActions from '../../../redux/actions/access-actions';
import { createFilter } from '../../../smart-components/myUserAccess/CommonBundleView';
import { GET_PRINCIPAL_ACCESS } from '../../../redux/action-types';
import PropTypes from 'prop-types';

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

describe('<MUAAccessTable />', () => {
  const mockStore = configureStore([thunk, promiseMiddleware, notificationsMiddleware()]);

  const userAccessMock = {
    type: GET_PRINCIPAL_ACCESS,
    payload: Promise.resolve({
      data: [],
      meta: {},
    }),
  };

  const initialProps = {
    showResourceDefinitions: false,
    apps: ['app1', 'app2'],
    hasActiveFilters: false,
    setFilters: jest.fn(),
  };

  const initialState = {
    accessReducer: {
      access: {
        data: [
          {
            permission: 'first:first:first',
            resourceDefinitions: [],
          },
          {
            permission: 'second:second:second',
            resourceDefinitions: [
              {
                attributeFilter: {
                  value: 'first-rd',
                },
              },
              {
                attributeFilter: {
                  value: 'second-rd',
                },
              },
            ],
          },
        ],
        meta: {
          count: 2,
          limit: 20,
          offset: 0,
        },
      },
    },
  };

  const getPrincipalAccessSpy = jest.spyOn(AccessActions, 'getPrincipalAccess');
  afterEach(() => {
    getPrincipalAccessSpy.mockReset();
  });

  it('should load data and render table', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: false });
    getPrincipalAccessSpy.mockImplementationOnce(() => userAccessMock);
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} />
        </ContextWrapper>,
      );
    });
    expect(screen.getAllByRole('row')).toHaveLength(2 + 1); // 2 rows + header
    expect(screen.getAllByText('first')).toHaveLength(3);
    expect(screen.getAllByText('second')).toHaveLength(3);
  });

  it('should load data and render table with resource definitions', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: false });
    getPrincipalAccessSpy.mockImplementationOnce(() => userAccessMock);
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>,
      );
    });

    expect(screen.getAllByText('first')).toHaveLength(3);
    expect(screen.getAllByText('N/A')).toHaveLength(1);
    expect(screen.getAllByText('second')).toHaveLength(3);
    expect(screen.getAllByText(2, { selector: 'a' })).toHaveLength(1);

    await act(async () => {
      await fireEvent.click(screen.getByText(2, { selector: 'a' }));
    });

    await act(async () => {
      // Wait for modal to open
      await Promise.resolve();
    });
    expect(
      screen.getByText('Resource definitions', {
        selector: '.pf-v5-c-modal-box__title-text',
      }),
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Close'));
    });
    expect(() =>
      screen.getByText('Resource definitions', {
        selector: '.pf-v5-c-modal-box__title-text',
      }),
    ).toThrow();
  });

  it('should filter applications', async () => {
    jest.useFakeTimers();
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: false });
    /**
     * There will be two API calls
     */
    getPrincipalAccessSpy.mockImplementationOnce(() => userAccessMock).mockImplementationOnce(() => userAccessMock);
    await act(async () => {
      render(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Filter by {key}'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('app2'));
    });
    /**
     * Skip debounce
     */
    await act(async () => {
      jest.runAllTimers();
    });
    expect(getPrincipalAccessSpy).toHaveBeenCalledTimes(2);
    expect(getPrincipalAccessSpy.mock.calls).toEqual([
      [{ application: 'app1,app2', itemCount: 0, count: 0, limit: 20, offset: 0, orderBy: 'application' }],
      [{ application: 'app2', count: 2, limit: 20, offset: 0, orderBy: 'application' }],
    ]);
  });
});
