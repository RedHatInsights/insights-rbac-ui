import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

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
    isProd: () => true,
    getEnvironment: () => 'test',
    appAction: () => {},
    appObjectId: () => {},
  },
};

Element.prototype.scrollTo = () => {};

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

Object.assign(global, { TextDecoder, TextEncoder });

// TODO several tests do not wrap components in a flag provider and assume this returns false
jest.mock('@unleash/proxy-client-react', () => {
  return {
    __esModule: true,
    useFlag: () => false,
  };
});
