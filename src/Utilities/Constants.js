const base_path = process.env.BASE_PATH || '/r/insights/platform';

const approval_path = process.env.APPROVAL_PATH || '/approval/v0.0';
const rbac_path = process.env.RBAC_PATH || '/rbac/v1';

export const APPROVAL_API_BASE = `${base_path}${approval_path}`;
export const RBAC_API_BASE = `${base_path}${rbac_path}`;
