import React from 'react';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import Groups from '../../smart-components/group/groups';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { groupsInitialState } from '../../redux/reducers/group-reducer';

describe('<Groups />', () => {

  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    initialProps = {};
    mockStore = configureStore(middlewares);
    initialState = { groupReducer: { ...groupsInitialState, isLoading: false }, userReducer: { ...groupsInitialState }};
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<Groups store={ store } { ...initialProps } />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<Groups store={ store } { ...initialProps } isLoading />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });
});
