import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import EditGroupModal from '../../../smart-components/group/edit-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import * as GroupActions from '../../../redux/actions/group-actions';
import { FETCH_GROUP } from '../../../redux/action-types';
import { defaultSettings } from '../../../helpers/shared/pagination';

jest.mock('../../../redux/actions/group-actions', () => {
  const actual = jest.requireActual('../../../redux/actions/group-actions');
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

  beforeEach(() => {
    initialProps = {
      cancelRoute: '/groups',
      group: {
        name: 'Foo',
        id: '1',
      },
      pagination: defaultSettings,
      filters: {},
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
    const wrapper = shallow(
      <Provider store={store}>
        <EditGroupModal {...initialProps} />
      </Provider>
    );
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should redirect back to close URL', async () => {
    const store = mockStore(initialState);
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <GroupWrapper store={store} initialEntries={['/groups/edit/:groupId']}>
          <Provider store={store}>
            <EditGroupModal {...initialProps} />
          </Provider>
        </GroupWrapper>
      );
    });
    wrapper.update();
    wrapper.find('button').first().simulate('click');
    expect(mockedNavigate).toHaveBeenCalledWith('/iam/user-access/groups', undefined);
  });
});
