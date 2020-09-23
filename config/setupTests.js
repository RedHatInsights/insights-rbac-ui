import { configure, mount, render, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import mock, { once } from 'xhr-mock';
import fetchMock from 'fetch-mock';

/**
 * mock fetch
 */
import 'whatwg-fetch';
global.fetchMock = fetchMock;

configure({ adapter: new Adapter() });

global.shallow = shallow;
global.render = render;
global.mount = mount;
global.React = React;

/**
 * Setup mock of tests
 */
mock.setup();
global.mockOnce = once;
global.apiClientMock = mock;

/**
 * setup ENV vars
 */
process.env.BASE_PATH = '/api';

export const entitlementsMock = {
  bundle1: {
    is_entitled: false,
    is_trial: false,
  },
  bundle2: {
    is_entitled: true,
    is_trial: false,
  },
};

export const getUserMock = {
  entitlements: { ...entitlementsMock },
  identity: { user: { is_org_admin: true } },
};

// mock insights instance
global.insights = {
  chrome: {
    auth: {
      getUser: () => new Promise((res) => res(getUserMock)),
    },
    appNavClick: () => Promise.resolve(),
    getUserPermissions: () => Promise.resolve([]),
    isBeta: () => true,
  },
};
