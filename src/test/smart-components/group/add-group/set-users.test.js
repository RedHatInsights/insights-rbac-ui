import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import SetUsers from '../../../../smart-components/group/add-group/set-users';

let initialProps;
let initialState;
const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
let mockStore;

describe('<SetUsers />', () => {
  beforeEach(() => {
    initialState = {
      roleReducer: {
        roles: [{
          label: 'foo',
          value: 'bar'
        }]
      },
      groupReducer: {
        groups: { data: [{
          uuid: '123',
          name: 'SampleGroup'
        }]}
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: []
      }
    };
    mockStore = configureStore(middlewares);
    initialProps = {
      setGroupData: jest.fn(),
      selectedUsers: [],
      setSelectedUsers: jest.fn(),
      optionIdx: 0,
      setOptionIdx: jest.fn(),
      createOption: jest.fn()
    };
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/', '/groups/add-group/', '/groups/' ] } initialIndex={ 1 }>
        <SetUsers { ...initialProps } />
      </MemoryRouter>
    </Provider>);

    expect(toJson(wrapper)).toMatchSnapshot();
  });
});

