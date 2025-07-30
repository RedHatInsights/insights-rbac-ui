import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { render, screen } from '@testing-library/react';
import * as ServiceAccountsHelper from '../../../../redux/service-accounts/helper';
import AddGroupServiceAccounts from '../../../../features/groups/service-account/add-group-service-accounts';
import { serviceAccountsInitialState } from '../../../../redux/service-accounts/reducer';
import * as useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { RESULTS } from '../../../../redux/service-accounts/constants';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => {
  return {
    __esModule: true,
    default: () => ({}),
    useChrome: () => {},
  };
});

describe('<AddGroupServiceAccounts />', () => {
  let initialState;
  let responseBody;
  let mockStore;

  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const fetchServiceAccountsSpy = jest.spyOn(ServiceAccountsHelper, 'getServiceAccounts');

  beforeEach(() => {
    initialState = {
      groupReducer: {
        groups: {
          data: [
            {
              uuid: '123',
              name: 'SampleGroup',
            },
          ],
        },
        systemGroup: {
          uuid: 'test',
        },
      },
      serviceAccountReducer: {
        ...serviceAccountsInitialState,
      },
    };
    responseBody = {
      data: [],
      limit: 1,
      offset: 0,
      status: RESULTS,
    };
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchServiceAccountsSpy.mockReset();
  });

  test('should render correctly empty', () => {
    jest.spyOn(useChrome, 'default').mockImplementationOnce(() => ({
      getEnvironmentDetails: () => {},
      auth: { getToken: () => 'token' },
    }));
    fetchServiceAccountsSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    const store = mockStore({ ...initialState });
    const container = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/service-accounts/add-service-account']}>
          <AddGroupServiceAccounts />
        </MemoryRouter>
      </Provider>,
    );
    expect(container.baseElement).toMatchSnapshot();
    expect(screen.getByText('No service accounts found')).toBeInTheDocument();
  });

  test('should render correctly with data', () => {
    jest.spyOn(useChrome, 'default').mockImplementationOnce(() => ({
      getEnvironmentDetails: () => {},
      auth: { getToken: () => 'token' },
    }));
    fetchServiceAccountsSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    const store = mockStore({
      ...initialState,
      serviceAccountReducer: {
        ...initialState.serviceAccountReducer,
        serviceAccounts: [
          {
            clientId: '0f81d08d-74b2',
            createdAt: 1705679691,
            createdBy: 'insights-qa',
            description: 'just-created',
            id: '0f81d08d-74b2',
            name: 'just-created',
          },
        ],
      },
    });
    const container = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/service-accounts/add-service-account']}>
          <AddGroupServiceAccounts />
        </MemoryRouter>
      </Provider>,
    );
    expect(container.baseElement).toMatchSnapshot();
    expect(screen.getAllByText('just-created')).toHaveLength(2);
  });
});
