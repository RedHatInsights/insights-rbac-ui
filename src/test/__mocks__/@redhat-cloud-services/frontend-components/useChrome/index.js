const useChrome = () => ({
  appNavClick: () => undefined,
  appObjectId: () => undefined,
  appAction: () => undefined,
  isProd: () => true,
  getEnvironment: () => undefined,
  auth: { getUser: () => undefined, getToken: () => Promise.resolve('') },
  getBundle: () => 'iam',
  getApp: () => 'user-access',
});

module.exports = useChrome;
module.exports.useChrome = useChrome;
