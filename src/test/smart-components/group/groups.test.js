import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { MemoryRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import Groups from '../../../features/groups/groups';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { groupsInitialState } from '../../../redux/groups/reducer';
import * as GroupActions from '../../../redux/groups/actions';
import { FETCH_ADMIN_GROUP, FETCH_GROUPS, FETCH_SYSTEM_GROUP } from '../../../redux/groups/action-types';
import { defaultSettings } from '../../../helpers/pagination';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('<Groups />', () => {
  let enhanceState;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchGroupsSpy = jest.spyOn(GroupActions, 'fetchGroups');
  const fetchAdminGroupSpy = jest.spyOn(GroupActions, 'fetchAdminGroup');
  const fetchSystemGroupSpy = jest.spyOn(GroupActions, 'fetchSystemGroup');
  beforeEach(() => {
    enhanceState = {
      data: [
        {
          uuid: '19eccddf-7e6a-41a2-b050-3e67f0af4ed1',
          name: 'Custom default access',
          description: 'Default group that contains default permissions for new users.',
          principalCount: 0,
          platform_default: true,
          roleCount: 6,
          created: '2019-12-03T18:56:01.184350Z',
          modified: '2020-02-06T08:50:12.064832Z',
          system: false,
        },
      ],
      meta: {
        count: 153,
        limit: 10,
        offset: 0,
      },
      filters: {},
      pagination: { ...defaultSettings, count: 0 },
    };
    mockStore = configureStore(middlewares);
    initialState = { groupReducer: { ...groupsInitialState, groups: enhanceState, systemGroup: enhanceState.data[0] } };
  });

  afterEach(() => {
    fetchGroupsSpy.mockReset();
    fetchAdminGroupSpy.mockReset();
    fetchSystemGroupSpy.mockReset();
  });

  it('should render group list correctly', async () => {
    fetchGroupsSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    let container;
    const store = mockStore(initialState);
    await act(async () => {
      const { container: ci } = render(
        <Provider store={store}>
          <Router initialEntries={['/groups']}>
            <Groups />
          </Router>
        </Provider>,
      );

      container = ci;
    });
    expect(container).toMatchSnapshot();
  });

  it('should fetch groups on mount', async () => {
    const store = mockStore(initialState);
    fetchGroupsSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={store}>
          <Router>
            <Groups />
          </Router>
          ,
        </Provider>,
      );
    });
    const expectedPayload = [
      { type: 'FETCH_GROUPS_PENDING' },
      { type: 'FETCH_ADMIN_GROUP_PENDING' },
      { type: 'FETCH_SYSTEM_GROUP_PENDING' },
      { payload: {}, type: 'FETCH_GROUPS_FULFILLED' },
      { payload: {}, type: 'FETCH_ADMIN_GROUP_FULFILLED' },
      { payload: {}, type: 'FETCH_SYSTEM_GROUP_FULFILLED' },
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });

  it('should fetch groups on next page click', async () => {
    const store = mockStore(initialState);
    fetchGroupsSpy
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={store}>
          <Router initialEntries={['/groups']}>
            <Groups />
          </Router>
        </Provider>,
      );
    });
    store.clearActions();
    await act(async () => {
      await fireEvent.click(screen.getAllByLabelText('Go to next page')[0]);
    });
    expect(fetchGroupsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: {
          name: undefined,
        },
        limit: 20,
        offset: 0,
        orderBy: 'name',
        usesMetaInURL: true,
      }),
    );
  });

  it('should fetch groups on filter and cancel filter', async () => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    const filterValue = 'filterValue';
    fetchGroupsSpy
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <Provider store={store}>
          <Router initialEntries={['/groups']}>
            <Groups />
          </Router>
        </Provider>,
      );
    });
    store.clearActions();
    await act(async () => {
      await fireEvent.change(screen.getByLabelText('text input'), { target: { value: filterValue } });
    });

    await act(async () => {
      await jest.runAllTimers();
    });

    await act(async () => {
      await Promise.resolve();
    });
    store.clearActions();
    expect(fetchGroupsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        count: 0,
        limit: 20,
        filters: { name: filterValue },
        offset: 0,
        usesMetaInURL: true,
        orderBy: 'name',
      }),
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Clear filters'));
    });
    expect(fetchGroupsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        count: 0,
        limit: 20,
        filters: { name: '' },
        offset: 0,
        usesMetaInURL: true,
        orderBy: 'name',
      }),
    );
    expect(fetchGroupsSpy).toHaveBeenCalledTimes(3);
  });

  it('should fetch groups on sort click', async () => {
    const store = mockStore(initialState);
    fetchGroupsSpy
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }))
      .mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    fetchAdminGroupSpy.mockImplementationOnce(() => ({ type: FETCH_ADMIN_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));

    await act(async () => {
      render(
        <Provider store={store}>
          <Router initialEntries={['/groups']}>
            <Groups />
          </Router>
        </Provider>,
      );
    });
    store.clearActions();
    await act(async () => {
      await fireEvent.click(screen.getByText('Name'));
    });
    expect(fetchGroupsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        count: 0,
        limit: 20,
        offset: 0,
        usesMetaInURL: true,
        filters: { name: undefined },
        orderBy: '-name',
      }),
    );
  });
});
