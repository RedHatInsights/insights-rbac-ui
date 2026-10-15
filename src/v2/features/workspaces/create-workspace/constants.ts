/**
 * Shared constants for the Create Workspace wizard.
 *
 * Kept in a dedicated module (not `schema.tsx`) because the schema file
 * imports the wizard step components for its typed component mapper, while
 * the components import these field-name constants — a single module for
 * both would create a circular dependency.
 */

export const WORKSPACE_NAME = 'workspace-name';
export const WORKSPACE_DESCRIPTION = 'workspace-description';
export const WORKSPACE_FEATURES = 'workspace-features';
export const WORKSPACE_PARENT = 'workspace-parent';
export const WORKSPACE_ACCOUNT = 'workspace-account';

/**
 * Placeholder bundle options for the billing features flow.
 * Gated behind `platform.rbac.workspaces-billing-features`.
 * Real implementation depends on Kessel integration — see CRCPLAN-274, CRCPLAN-367.
 */
export const BUNDLES = [
  {
    label: 'OpenShift',
    value: 'openshift',
  },
  {
    label: 'RHEL',
    value: 'rhel',
  },
  {
    label: 'Ansible Lightspeed',
    value: 'lightspeed',
  },
];
