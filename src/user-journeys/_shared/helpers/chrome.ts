/**
 * Creates a mock Chrome API object for Storybook tests
 */
export const makeChrome = ({
  environment,
  isOrgAdmin = true,
  userAccessAdministrator = false,
}: {
  environment: string;
  isOrgAdmin?: boolean;
  userAccessAdministrator?: boolean;
}) => {
  // Determine permissions based on role
  let permissions;
  if (isOrgAdmin) {
    // Org Admin: Full RBAC access
    permissions = [
      { permission: 'rbac:*:*', resourceDefinitions: [] },
      { permission: 'inventory:hosts:read', resourceDefinitions: [] },
    ];
  } else if (userAccessAdministrator) {
    // User Access Admin: Can manage users and groups, but not full RBAC
    permissions = [
      { permission: 'rbac:group:*', resourceDefinitions: [] },
      { permission: 'rbac:principal:*', resourceDefinitions: [] },
      { permission: 'rbac:role:read', resourceDefinitions: [] },
    ];
  } else {
    // Regular user: Read-only
    permissions = [
      { permission: 'rbac:group:read', resourceDefinitions: [] },
      { permission: 'rbac:role:read', resourceDefinitions: [] },
    ];
  }

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          identity: {
            user: {
              username: 'test-user',
              email: 'test@redhat.com',
              first_name: 'Test',
              last_name: 'User',
              is_org_admin: isOrgAdmin,
            },
          },
          entitlements: {
            ansible: { is_entitled: true },
            cost_management: { is_entitled: true },
            insights: { is_entitled: true },
            openshift: { is_entitled: true },
            rhel: { is_entitled: true },
            smart_management: { is_entitled: false },
          },
        }),
      getToken: () => Promise.resolve('mock-token-12345'),
    },
    getUserPermissions: () => Promise.resolve(permissions),
    isBeta: () => false, // Deprecated, always returns false
    getEnvironment: () => environment,
    getBundle: () => 'iam',
    getApp: () => 'user-access',
  };
};
