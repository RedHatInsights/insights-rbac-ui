export const bundleData = [
  {
    entitlement: 'insights',
    title: 'Red Hat Insights',
    body: 'Identify and remediate configuration issues in your Red Hat environments.',
    url: 'insights',
    apps: {
      dashboard: '/dashboard',
      patch: '/patch',
      advisor: '/advisor',
      drift: '/drift',
      vulnerability: '/vulnerability',
      policies: '/policies',
      compliance: '/compliance'
    }
  },
  {
    entitlement: 'openshift',
    title: 'Red Hat Openshift Cluster Manager',
    body: 'Install, register, and manage Red Hat OpenShift 4 clusters.',
    url: 'openshift',
    apps: {
      'cluster manager': '/'
    }
  },
  {
    entitlement: 'ansible',
    title: 'Red Hat Ansible Automation Platform',
    body: 'Extend your automation with analytics, policy and governance, and content management.',
    url: 'ansible',
    apps: {
      'automation analytics': '/automation-analytics',
      'automation hub': '/automation-hub',
      'automation services catalog': '/catalog'
    }
  },
  {
    entitlement: 'cost_management',
    title: 'Cost Management',
    body: 'Analyze, forecast and optimize your Red Hat OpenShift cluster costs in hybrid cloud environments.',
    url: 'cost-management',
    apps: {
      'cost management': '/'
    }
  },
  {
    entitlement: 'migrations',
    title: 'Migration Services',
    body: 'Get recommendations on migrating your applications and infrastructure to Red Hat.',
    url: 'migrations',
    apps: {
        'migration analytics': '/migration-analytics'
    }
  },
  {
    entitlement: 'subscriptions',
    title: 'Subscription Watch',
    body: 'Account-level summaries of your Red Hat subscription utilization.',
    url: 'subscriptions',
    apps: {
      'Red Hat Enterprise Linux': '/rhel-sw',
      'Red Hat OpenShift': '/openshift-sw'
    }
  }
];
