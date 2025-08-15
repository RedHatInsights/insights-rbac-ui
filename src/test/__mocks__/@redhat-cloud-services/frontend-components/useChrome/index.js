const useChrome = () => ({
  appNavClick: () => undefined,
  appObjectId: () => undefined,
  appAction: () => undefined,
  isProd: () => true,
  getEnvironment: () => undefined,
  auth: { getUser: () => Promise.resolve({ identity: { user: { is_org_admin: false } } }), getToken: () => Promise.resolve('') },
  getBundle: () => 'iam',
  getApp: () => 'user-access',
  getUserPermissions: () => Promise.resolve([]),
});

module.exports = useChrome;
module.exports.useChrome = useChrome;
