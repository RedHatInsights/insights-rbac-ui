import React from 'react';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupRoles from '../../../../smart-components/group/role/group-roles';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { rolesInitialState } from '../../../../redux/reducers/role-reducer';
import { groupsInitialState } from '../../../../redux/reducers/group-reducer';

describe('<GroupPrincipals />', () => {

  let initialProps;
  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    initialProps = {};
    mockStore = configureStore(middlewares);
    initialState = {
      roleReducer: { ...rolesInitialState, isLoading: false },
      groupReducer: { ...groupsInitialState, isLoading: false }
    };
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<GroupRoles store={ store } { ...initialProps } />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<GroupRoles store={ store } { ...initialProps } isLoading />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });
});
