import React from 'react';
import thunk from 'redux-thunk';
import { render } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store' ;
import toJson from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupPrincipals from '../../../../smart-components/group/principal/principals';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';

describe('<GroupPrincipals />', () => {

  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    initialProps = {
      match: {
        params: 'test-uuid'
      }
    };
    mockStore = configureStore(middlewares);
    initialState = { groupReducer: {
      groups: {}, selectedGroup: {
        loaded: true,
        principals: [
          {
            email: 'test-email',
            first_name: 'tes-first-name',
            last_name: 'test-last-name',
            username: 'test-username'
          }
        ]
      }, isLoading: false
    }};
  });

  it('should render correctly with members', () => {
    const store = mockStore(initialState);
    const wrapper = render(<Router>
      <GroupPrincipals store={ store } { ...initialProps } />
    </Router>);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with empty members', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          loaded: true
        }
      }
    });
    const wrapper = render(<Router>
      <GroupPrincipals store={ store } { ...initialProps } />
    </Router>);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          loaded: false
        }
      }
    });
    const wrapper = render(<Router>
      <GroupPrincipals store={ store } { ...initialProps } isLoading />
    </Router>);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with org admin rights', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        groups: {
          entitlements: {
            user: {
              is_org_admin: true
            }
          }
        }
      }
    });
    const wrapper = render(<Router>
      <GroupPrincipals store={ store } { ...initialProps } />
    </Router>);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with default group', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          platform_default: true,
          loaded: true
        }
      }
    });
    const wrapper = render(<Router>
      <GroupPrincipals store={ store } { ...initialProps } isLoading />
    </Router>);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
