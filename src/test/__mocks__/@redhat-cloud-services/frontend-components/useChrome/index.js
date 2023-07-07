const useChrome = () => ({
  appNavClick: () => undefined,
  appObjectId: () => undefined,
  appAction: () => undefined,
  isProd: () => true,
  getEnvironment: () => undefined,
  auth: { getUser: () => undefined },
});

module.exports = useChrome;
module.exports.useChrome = useChrome;
