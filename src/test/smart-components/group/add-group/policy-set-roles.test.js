import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import thunk from 'redux-thunk';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import AddGroupWizard from '../../../../smart-components/group/add-group/add-group-wizard';

describe('<PolicySetRoles />', () => {
  let initialProps;
  let initialState;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;

  const GroupWrapper = ({ store, children }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/policies/', '/policy/add-role/' ] } initialIndex={ 1 } keyLength={ 0 }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      selectedRoles: [],
      setSelectedRoles: jest.fn(),
      roles: [],
      title: 'Test set roles',
      description: 'Test for set roles page'
    };
    initialState = {
      roleReducer: {
        roles: [{
          uuid: '123',
          value: 'foo'
        }]
      },
      groupReducer: {
        groups: {
          data: [{
            uuid: '123',
            name: 'SampleGroup'
          }]
        }
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', () => {
    Date.now = jest.fn(() => '123');
    const store = mockStore(initialState);
    const wrapper = mount(
      <GroupWrapper store={ store }>
        <Route path="/groups/add-group/" render={ () => <AddGroupWizard { ...initialProps } /> } />
      </GroupWrapper>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
