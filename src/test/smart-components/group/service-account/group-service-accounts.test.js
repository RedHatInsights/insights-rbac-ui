import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import GroupServiceAccounts from '../../../../features/groups/service-account/group-service-accounts';
import { groupsInitialState } from '../../../../redux/groups/reducer';
import * as GroupActions from '../../../../redux/groups/actions';
import { FETCH_GROUP, FETCH_SERVICE_ACCOUNTS_FOR_GROUP, FETCH_SYSTEM_GROUP } from '../../../../redux/groups/action-types';

jest.mock('../../../../redux/groups/actions', () => {
  const actual = jest.requireActual('../../../../redux/groups/actions');
  return {
    __esModule: true,
    ...actual,
  };
});

describe('<GroupServiceAccounts />', () => {
  let initialProps;
  let mockStore;
  let initialState;

  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');
  const fetchSystemGroupSpy = jest.spyOn(GroupActions, 'fetchSystemGroup');
  const fetchServiceAccountsForGroupSpy = jest.spyOn(GroupActions, 'fetchServiceAccountsForGroup');

  beforeEach(() => {
    initialProps = {};
    mockStore = configureStore();
    initialState = {
      groupReducer: {
        ...groupsInitialState,
      },
    };
  });

  afterEach(() => {
    fetchGroupSpy.mockReset();
    fetchSystemGroupSpy.mockReset();
    fetchServiceAccountsForGroupSpy.mockReset();
  });

  it('should render correctly', () => {
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    fetchSystemGroupSpy.mockImplementationOnce(() => ({ type: FETCH_SYSTEM_GROUP, payload: Promise.resolve({}) }));
    fetchServiceAccountsForGroupSpy.mockImplementationOnce(() => ({
      type: FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
      payload: Promise.resolve({ data: [], meta: { count: 0 } }),
    }));
    const store = mockStore(initialState);
    const container = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/123/service-accounts']} initialIndex={0}>
          <Routes>
            <Route path="/groups/detail/:groupId/service-accounts" element={<GroupServiceAccounts />} {...initialProps} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('Add service account')).toBeVisible();
    expect(container.baseElement).toMatchSnapshot();
  });
});
