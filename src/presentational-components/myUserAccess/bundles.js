export const bundleData = [
  {
    entitlement: 'insights',
    title: 'Red Hat Insights',
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
    apps: {
      'cluster manager': '/'
    }
  },
  {
    entitlement: 'ansible',
    title: 'Red Hat Ansible Automation Platform',
    apps: {
      'automation analytics': '/automation-analytics',
      'automation hub': '/automation-hub',
      'automation services catalog': '/catalog'
    }
  },
  {
    entitlement: 'cost_management',
    title: 'Cost Management',
    apps: {
      'cost management': '/'
    }
  },
  {
    entitlement: 'migrations',
    title: 'Migration Services',
    apps: {
        'migration analytics': '/migration-analytics'
    }
  },
  {
    entitlement: 'subscriptions',
    title: 'Subscription Watch',
    apps: {
      'Red Hat Enterprise Linux': '/rhel-sw',
      'Red Hat OpenShift': '/openshift-sw'
    }
  }
];
