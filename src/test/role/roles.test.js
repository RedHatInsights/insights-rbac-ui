import React from 'react';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import Roles from '../../smart-components/role/roles';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { rolesInitialState } from '../../redux/reducers/role-reducer';

describe('<Roles />', () => {

  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    initialProps = {};
    mockStore = configureStore(middlewares);
    initialState = { roleReducer: { ...rolesInitialState, isLoading: false }, userReducer: { ...rolesInitialState }};
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<Roles store={ store } { ...initialProps } />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<Roles store={ store } { ...initialProps } isLoading />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });
});
