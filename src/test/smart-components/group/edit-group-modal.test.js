import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import EditGroupModal from '../../../features/groups/edit-group-modal';
import { groupsInitialState } from '../../../redux/groups/reducer';
import * as GroupActions from '../../../redux/groups/actions';
import { FETCH_GROUP } from '../../../redux/groups/action-types';
import { defaultSettings } from '../../../helpers/pagination';
import PropTypes from 'prop-types';

jest.mock('../../../redux/groups/actions', () => {
  const actual = jest.requireActual('../../../redux/groups/actions');
  return {
    __esModule: true,
    ...actual,
  };
});

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('<EditGroupModal />', () => {
  let initialProps;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');

  const GroupWrapper = ({ store, children, initialEntries = [] }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  );
  GroupWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    store: PropTypes.object.isRequired,
    initialEntries: PropTypes.arrayOf(PropTypes.string),
  };
  beforeEach(() => {
    initialProps = {
      cancelRoute: '/groups',
      group: {
        name: 'Foo',
        id: '1',
      },
      pagination: defaultSettings,
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        groupData: {
          name: 'Foo',
          id: '1',
        },
      },
    };
  });

  afterEach(() => {
    fetchGroupSpy.mockReset();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <EditGroupModal {...initialProps} />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should redirect back to close URL', async () => {
    const store = mockStore(initialState);
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    await act(async () => {
      render(
        <GroupWrapper store={store} initialEntries={['/groups/edit/:groupId']}>
          <Provider store={store}>
            <EditGroupModal {...initialProps} />
          </Provider>
        </GroupWrapper>,
      );
    });

    await act(async () => {
      await fireEvent.click(screen.getByText('Cancel'));
    });
    expect(mockedNavigate).toHaveBeenCalledWith('/iam/user-access/groups', undefined);
  });
});
