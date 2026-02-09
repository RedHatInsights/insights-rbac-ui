import React, { useRef } from 'react';
import { fn } from 'storybook/test';
import { useMockState } from '../contexts/StorybookMockContext';

// Chrome spy for testing navigation clicks
export const chromeAppNavClickSpy = fn();

// TODO: Import actual type from @redhat-cloud-services/types or define interface matching real API
interface ChromeAPI {
  getEnvironment: () => string;
  getEnvironmentDetails: () => { environment: string; sso: string; portal: string };
  isProd: boolean;
  isBeta: () => boolean;
  getBundle: () => string;
  getApp: () => string;
  auth: {
    getToken: () => Promise<string>;
    getUser: () => Promise<{ identity?: { user?: { is_org_admin?: boolean; username?: string; email?: string; is_internal?: boolean } } }>;
  };
  getUserPermissions: (app: string) => Promise<Array<{ permission: string; resourceDefinitions: unknown[] }>>;
  appNavClick: typeof chromeAppNavClickSpy;
  appObjectId: (id: string) => void;
  appAction: (action: string | undefined) => void;
  updateDocumentTitle: (title: string) => void;
  quickStarts: {
    Catalog: React.FC;
    set?: (id: string, state: Record<string, unknown>) => void;
    toggle?: (id: string) => void;
  };
}

// Mock Quickstarts Catalog component for Storybook
const MockCatalog: React.FC = () => {
  const quickstartTutorials = [
    {
      id: 'getting-started-rbac',
      title: 'Getting Started with RBAC',
      description: 'Learn the basics of role-based access control and how to manage user permissions.',
      estimatedTime: '10 minutes',
      level: 'Beginner',
      status: 'Available',
    },
    {
      id: 'creating-custom-roles',
      title: 'Creating Custom Roles',
      description: 'Step-by-step guide to creating and configuring custom roles for your organization.',
      estimatedTime: '15 minutes',
      level: 'Intermediate',
      status: 'Available',
    },
    {
      id: 'managing-user-groups',
      title: 'Managing User Groups',
      description: 'Learn how to organize users into groups and assign permissions efficiently.',
      estimatedTime: '12 minutes',
      level: 'Beginner',
      status: 'In Progress',
    },
    {
      id: 'workspace-administration',
      title: 'Workspace Administration',
      description: 'Master workspace management, from creation to advanced configuration.',
      estimatedTime: '20 minutes',
      level: 'Advanced',
      status: 'Available',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#3e8635';
      case 'In Progress':
        return '#f0ab00';
      case 'Completed':
        return '#2b9af3';
      default:
        return '#6a6e73';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return '#3e8635';
      case 'Intermediate':
        return '#f0ab00';
      case 'Advanced':
        return '#c9190b';
      default:
        return '#6a6e73';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 300 }}>Quick starts</h2>
        <p style={{ color: '#6a6e73', margin: '0', fontSize: '14px' }}>
          Get started with step-by-step instructions and guided tours to help you learn Red Hat&apos;s User Access features.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {quickstartTutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            style={{
              border: '1px solid #d2d2d2',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#151515' }}>{tutorial.title}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#6a6e73', lineHeight: '1.4' }}>{tutorial.description}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6a6e73' }}>🕒 {tutorial.estimatedTime}</span>
              <span style={{ fontSize: '12px', color: getLevelColor(tutorial.level), fontWeight: 600 }}>{tutorial.level}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '12px',
                  color: getStatusColor(tutorial.status),
                  fontWeight: 500,
                  padding: '2px 8px',
                  backgroundColor: getStatusColor(tutorial.status) + '20',
                  borderRadius: '12px',
                }}
              >
                {tutorial.status}
              </span>
              <button
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#2b9af3',
                  backgroundColor: 'transparent',
                  border: '1px solid #2b9af3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {tutorial.status === 'In Progress' ? 'Continue' : 'Start'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#6a6e73', margin: '0', fontSize: '14px', fontStyle: 'italic' }}>
          💡 This is a Storybook mock of the PatternFly Quickstarts Catalog. In production, this would load actual tutorial content and track user
          progress.
        </p>
      </div>
    </div>
  );
};

export default function useChrome(): ChromeAPI {
  const mock = useMockState();

  // Keep mock state in ref so closures always read current values
  const mockRef = useRef(mock);
  mockRef.current = mock;

  // Create chrome object once - stable reference forever
  const chromeRef = useRef<ChromeAPI | null>(null);

  if (!chromeRef.current) {
    chromeRef.current = {
      // Environment - functions read from mockRef.current
      getEnvironment: () => (mockRef.current.environment === 'production' ? 'prod' : 'stage'),
      getEnvironmentDetails: () => ({
        environment: mockRef.current.environment === 'production' ? 'prod' : 'stage',
        sso: mockRef.current.environment === 'production' ? 'https://sso.redhat.com' : 'https://sso.stage.redhat.com',
        portal: 'https://console.redhat.com',
      }),
      get isProd() {
        return mockRef.current.environment === 'production';
      },
      isBeta: () => false, // Deprecated, always false
      getBundle: () => 'iam',
      getApp: () => 'user-access',

      // Auth
      auth: {
        getToken: () => Promise.resolve('mock-token-12345'),
        getUser: () => {
          // Use custom userIdentity from context if provided, otherwise use defaults
          const customIdentity = mockRef.current.userIdentity;
          return Promise.resolve({
            identity: {
              account_number: customIdentity?.account_number,
              org_id: customIdentity?.org_id ?? 'mock-org-id',
              organization: customIdentity?.organization,
              internal: customIdentity?.internal,
              user: {
                is_org_admin: customIdentity?.user?.is_org_admin ?? mockRef.current.isOrgAdmin,
                username: customIdentity?.user?.username ?? 'test-user',
                email: customIdentity?.user?.email ?? 'test@redhat.com',
                is_internal: customIdentity?.user?.is_internal ?? false,
                first_name: customIdentity?.user?.first_name,
                last_name: customIdentity?.user?.last_name,
                is_active: customIdentity?.user?.is_active ?? true,
                locale: customIdentity?.user?.locale ?? 'en_US',
              },
            },
            entitlements: customIdentity?.entitlements ?? {},
          });
        },
      },

      // Permissions (used by useUserData)
      getUserPermissions: (app: string) =>
        Promise.resolve(
          mockRef.current.permissions.filter((p) => p.startsWith(`${app}:`)).map((permission) => ({ permission, resourceDefinitions: [] })),
        ),

      // Tracking - use spy for appNavClick, no-ops for others
      appNavClick: chromeAppNavClickSpy,
      appObjectId: () => {},
      appAction: () => {},
      updateDocumentTitle: (title: string) => {
        if (typeof document !== 'undefined') {
          document.title = title;
        }
      },

      // QuickStarts
      quickStarts: {
        Catalog: MockCatalog,
        set: () => {},
        toggle: () => {},
      },
    };
  }

  return chromeRef.current;
}

// Named export for compatibility
export { useChrome };
