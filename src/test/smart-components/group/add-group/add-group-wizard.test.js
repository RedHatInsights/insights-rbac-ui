import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import AddGroupWizard, { onCancel } from '../../../../features/groups/add-group/add-group-wizard';
import { defaultSettings } from '../../../../helpers/pagination';
import PropTypes from 'prop-types';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => {
  return {
    __esModule: true,
    default: () => ({
      isBeta: () => true,
    }),
  };
});

jest.mock('@unleash/proxy-client-react', () => ({
  __esModule: true,
  useFlag: () => true,
}));

describe('<AddGroupWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const GroupWrapper = ({ store, children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/groups/', '/groups/add-group/', '/groups/']} initialIndex={1}>
        {children}
      </MemoryRouter>
    </Provider>
  );
  GroupWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    store: PropTypes.object.isRequired,
  };
  beforeEach(() => {
    initialProps = {
      uuid: '123',
      pagination: defaultSettings,
      filters: {},
    };

    initialState = {
      roleReducer: {
        roles: [
          {
            label: 'foo',
            value: 'bar',
          },
        ],
      },
      groupReducer: {
        groups: {
          data: [
            {
              uuid: '123',
              name: 'SampleGroup',
            },
          ],
        },
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: [],
      },
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', async () => {
    const store = mockStore(initialState);
    let container;
    await act(async () => {
      const { container: ci } = render(
        <GroupWrapper store={store}>
          <AddGroupWizard {...initialProps} />
        </GroupWrapper>,
      );
      container = ci;
    });

    expect(container).toMatchSnapshot();
  });

  it('onCancel call right callback with empty data', () => {
    const formData = {};
    const emptyCallback = jest.fn();
    const nonEmptyCallback = jest.fn();
    const setData = jest.fn();
    onCancel(emptyCallback, nonEmptyCallback, setData)(formData);
    expect(emptyCallback.mock.calls.length).toBe(1);
    expect(nonEmptyCallback.mock.calls.length).toBe(0);
    expect(setData.mock.calls[0][0]).toStrictEqual({});
  });

  it('onCancel call right callback with non empty data', () => {
    const formData = { data: 'test' };
    const emptyCallback = jest.fn();
    const nonEmptyCallback = jest.fn();
    const setData = jest.fn();
    onCancel(emptyCallback, nonEmptyCallback, setData)(formData);
    expect(emptyCallback.mock.calls.length).toBe(0);
    expect(nonEmptyCallback.mock.calls.length).toBe(1);
    expect(setData.mock.calls[0][0]).toStrictEqual({ data: 'test' });
  });
});
