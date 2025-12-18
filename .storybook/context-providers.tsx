import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { fn } from 'storybook/test';

// Types
export interface ChromeConfig {
  environment: string;
  [key: string]: any;
}

export interface FeatureFlagsConfig {
  [flagName: string]: boolean;
}

export interface PermissionsConfig {
  orgAdmin: boolean;
  userAccessAdministrator: boolean;
}

// Chrome Context
const ChromeContext = createContext<ChromeConfig>({
  environment: 'prod'
});

export const ChromeProvider: React.FC<{ value: ChromeConfig; children: ReactNode }> = ({ value, children }) => (
  <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>
);

// Feature Flags Context
const FeatureFlagsContext = createContext<FeatureFlagsConfig>({});

export const FeatureFlagsProvider: React.FC<{ value: FeatureFlagsConfig; children: ReactNode }> = ({ value, children }) => (
  <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
);

// Permissions Context
const PermissionsContext = createContext<PermissionsConfig>({
  orgAdmin: false,
  userAccessAdministrator: false
});

export const PermissionsProvider: React.FC<{ value: PermissionsConfig; children: ReactNode }> = ({ value, children }) => (
  <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
);

// Chrome spy for testing - IS the spy function
export const chromeAppNavClickSpy = fn();

// Mock Hook Implementations (only for Storybook)
export const useChrome = () => {
  const chromeConfig = useContext(ChromeContext);
  
  // Mock Quickstarts Catalog component for Storybook
  const MockCatalog: React.FC = () => {
    const quickstartTutorials = [
      {
        id: 'getting-started-rbac',
        title: 'Getting Started with RBAC',
        description: 'Learn the basics of role-based access control and how to manage user permissions.',
        estimatedTime: '10 minutes',
        level: 'Beginner',
        status: 'Available'
      },
      {
        id: 'creating-custom-roles',
        title: 'Creating Custom Roles',
        description: 'Step-by-step guide to creating and configuring custom roles for your organization.',
        estimatedTime: '15 minutes', 
        level: 'Intermediate',
        status: 'Available'
      },
      {
        id: 'managing-user-groups',
        title: 'Managing User Groups',
        description: 'Learn how to organize users into groups and assign permissions efficiently.',
        estimatedTime: '12 minutes',
        level: 'Beginner', 
        status: 'In Progress'
      },
      {
        id: 'workspace-administration',
        title: 'Workspace Administration',
        description: 'Master workspace management, from creation to advanced configuration.',
        estimatedTime: '20 minutes',
        level: 'Advanced',
        status: 'Available'
      }
    ];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Available': return '#3e8635';
        case 'In Progress': return '#f0ab00';
        case 'Completed': return '#2b9af3';
        default: return '#6a6e73';
      }
    };

    const getLevelColor = (level: string) => {
      switch (level) {
        case 'Beginner': return '#3e8635';
        case 'Intermediate': return '#f0ab00'; 
        case 'Advanced': return '#c9190b';
        default: return '#6a6e73';
      }
    };

    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 300 }}>
            Quick starts
          </h2>
          <p style={{ color: '#6a6e73', margin: '0', fontSize: '14px' }}>
            Get started with step-by-step instructions and guided tours to help you learn Red Hat's User Access features.
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2b9af3';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d2d2d2';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  color: '#151515'
                }}>
                  {tutorial.title}
                </h3>
                <p style={{ 
                  margin: '0', 
                  fontSize: '14px', 
                  color: '#6a6e73', 
                  lineHeight: '1.4' 
                }}>
                  {tutorial.description}
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6a6e73',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🕒 {tutorial.estimatedTime}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: getLevelColor(tutorial.level),
                  fontWeight: 600
                }}>
                  {tutorial.level}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{
                  fontSize: '12px',
                  color: getStatusColor(tutorial.status),
                  fontWeight: 500,
                  padding: '2px 8px',
                  backgroundColor: getStatusColor(tutorial.status) + '20',
                  borderRadius: '12px'
                }}>
                  {tutorial.status}
                </span>
                <button style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#2b9af3',
                  backgroundColor: 'transparent',
                  border: '1px solid #2b9af3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  {tutorial.status === 'In Progress' ? 'Continue' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          textAlign: 'center' as const
        }}>
          <p style={{ 
            color: '#6a6e73', 
            margin: '0', 
            fontSize: '14px',
            fontStyle: 'italic' 
          }}>
            💡 This is a Storybook mock of the PatternFly Quickstarts Catalog ({chromeConfig.environment} environment). In production, this would load actual tutorial content and track user progress.
          </p>
        </div>
      </div>
    );
  };
  
  return useMemo(() => ({
    getEnvironment: () => chromeConfig.environment,
    getEnvironmentDetails: () => ({
      environment: chromeConfig.environment,
      sso: 'https://sso.redhat.com',
      portal: 'https://console.redhat.com'
    }),
    isProd: () => chromeConfig.environment === 'prod',
    isBeta: () => chromeConfig.environment !== 'prod',
    appNavClick: chromeAppNavClickSpy,
    appObjectId: () => undefined,
    appAction: () => undefined,
    updateDocumentTitle: (title: string) => {
      // Mock document title update for Storybook
      if (typeof document !== 'undefined') {
        document.title = title;
      }
    },
    auth: chromeConfig.auth || { 
      getUser: () => Promise.resolve({ 
        identity: { 
          user: { 
            username: 'test-user', 
            email: 'test@redhat.com',
            is_org_admin: true,
            is_internal: false
          } 
        } 
      }), 
      getToken: () => Promise.resolve('mock-jwt-token-12345') 
    },
    getBundle: () => 'iam',
    getApp: () => 'user-access',
    getUserPermissions: () => Promise.resolve([
      { 
        permission: 'inventory:hosts:read',
        resourceDefinitions: []
      },
      { 
        permission: 'inventory:hosts:write',
        resourceDefinitions: []
      }, 
      { 
        permission: 'inventory:groups:write',
        resourceDefinitions: []
      },
      { 
        permission: 'rbac:*:*',
        resourceDefinitions: []
      }
    ]),
    quickStarts: {
      Catalog: MockCatalog
    },
    ...chromeConfig
  }), [chromeConfig]);
};

export const useFlag = (flagName: string): boolean => {
  const flags = useContext(FeatureFlagsContext);
  return flags[flagName] || false;
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};

// Export contexts for direct use if needed
export { ChromeContext, FeatureFlagsContext, PermissionsContext }; 