import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import MUAAccessTable from '../../../smart-components/myUserAccess/MUAAccessTable';
import * as AccessActions from '../../../redux/actions/access-actions';
import { createFilter } from '../../../smart-components/myUserAccess/CommonBundleView';
import { GET_PRINCIPAL_ACCESS } from '../../../redux/action-types';
import { RowWrapper } from '@patternfly/react-table';
import ResourceDefinitionsLink from '../../../presentational-components/myUserAccess/ResourceDefinitionsLink';
import ResourceDefinitionsModal from '../../../smart-components/myUserAccess/ResourceDefinitionsModal';
import { Modal } from '@patternfly/react-core';

const ContextWrapper = ({ children, store, initialEntries = ['/foo?bundle="bundle"'] }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  </Provider>
);
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
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} />
        </ContextWrapper>
      );
    });
    wrapper.update();
    expect(wrapper.find(RowWrapper)).toHaveLength(2);
    expect(wrapper.find(RowWrapper).first().prop('row').cells).toEqual(['first', 'first', 'first']);
    expect(wrapper.find(RowWrapper).last().prop('row').cells).toEqual(['second', 'second', 'second']);
  });

  it('should load data and render table with resource definitions', async () => {
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: false });
    getPrincipalAccessSpy.mockImplementationOnce(() => userAccessMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>
      );
    });
    wrapper.update();
    expect(wrapper.find(RowWrapper)).toHaveLength(2);
    expect(wrapper.find(RowWrapper).first().prop('row').cells).toEqual(['first', 'first', 'first', expect.any(Object)]);
    expect(wrapper.find(RowWrapper).last().prop('row').cells).toEqual(['second', 'second', 'second', expect.any(Object)]);

    act(() => {
      wrapper.find(ResourceDefinitionsLink).last().prop('onClick')();
    });
    wrapper.update();
    expect(wrapper.find(ResourceDefinitionsModal).prop('isOpen')).toEqual(true);

    act(() => {
      wrapper.find(Modal).prop('onClose')();
    });
    wrapper.update();
    expect(wrapper.find(ResourceDefinitionsModal)).toHaveLength(0);
  });

  it('should filter applications', async () => {
    jest.useFakeTimers();
    const filters = createFilter({ apps: initialProps.apps, isOrgAdmin: false });
    /**
     * There will be two API calls
     */
    getPrincipalAccessSpy.mockImplementationOnce(() => userAccessMock).mockImplementationOnce(() => userAccessMock);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ContextWrapper store={mockStore(initialState)}>
          <MUAAccessTable filters={filters} {...initialProps} showResourceDefinitions />
        </ContextWrapper>
      );
    });
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
    jest.runAllTimers();
    wrapper.update();
    expect(getPrincipalAccessSpy).toHaveBeenCalledTimes(2);
    expect(getPrincipalAccessSpy.mock.calls).toEqual([
      [{ application: 'app1,app2', itemCount: 0, limit: 20, offset: 0 }],
      [{ application: 'app2', count: 2, limit: 20, offset: 0, orderBy: undefined }],
    ]);
  });
});
