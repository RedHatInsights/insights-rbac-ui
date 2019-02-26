const base_path = process.env.BASE_PATH || '/r/insights/platform';

const approval_path = process.env.APPROVAL_PATH || '/approval/v0.0';

export const APPROVAL_API_BASE = `${base_path}${approval_path}`;
export const RBAC_API_BASE = `https://ci.foo.redhat.com:1337/r/insights/platform/rbac/api/v1`;
