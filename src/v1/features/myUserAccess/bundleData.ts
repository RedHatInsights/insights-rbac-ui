/**
 * Bundle data structure interfaces
 */
export interface BundleData {
  entitlement: string;
  title: string;
  apps: Record<string, string>;
  appsIds: string[];
}

export const bundleData: BundleData[] = [
  {
    entitlement: 'openshift',
    title: 'OpenShift',
    apps: {
      clusters: '/',
      advisor: '/insights/advisor',
      subscriptions: '/subscriptions',
      'cost management': '/cost-management',
    },
    appsIds: ['cost-management', 'subscriptions', 'ocp-advisor', 'ocm'],
  },
  {
    entitlement: 'rhel',
    title: 'Red Hat Enterprise Linux',
    apps: {
      advisor: '/advisor',
      compliance: '/compliance',
      drift: '/drift',
      'image builder': '/image-builder',
      patch: '/patch',
      vulnerability: '/vulnerability',
      policies: '/policies',
      remediations: '/remediations',
      subscriptions: '/subscriptions',
      repositories: '/content',
      provisioning: '/provisioning',
      tasks: '/tasks',
      ros: '/ros',
      'malware detection': '/malware-detection',
    },
    appsIds: [
      'dashboard',
      'patch',
      'advisor',
      'drift',
      'vulnerability',
      'policies',
      'compliance',
      'inventory',
      'notifications',
      'image-builder',
      'remediations',
      'subscriptions',
      'content-sources',
      'provisioning',
      'tasks',
      'ros',
      'malware-detection',
    ],
  },
  {
    entitlement: 'ansible',
    title: 'Ansible Automation Platform',
    apps: {
      'automation hub': '/automation-hub',
      'automation services catalog': '/catalog',
      insights: '/automation-analytics',
    },
    appsIds: ['catalog', 'approval', 'automation-analytics', 'automation-hub'],
  },
  {
    entitlement: 'settings',
    title: 'Settings and User Access',
    apps: {
      rbac: '/rbac',
      sources: '/sources',
    },
    appsIds: ['rbac', 'sources'],
  },
];
