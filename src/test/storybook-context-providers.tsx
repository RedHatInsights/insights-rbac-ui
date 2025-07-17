import React, { createContext, useContext, ReactNode } from 'react';

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

// Mock Hook Implementations (only for Storybook)
export const useChrome = () => {
  const chromeConfig = useContext(ChromeContext);
  
  return {
    getEnvironment: () => chromeConfig.environment,
    isProd: () => chromeConfig.environment === 'prod',
    isBeta: () => chromeConfig.environment !== 'prod',
    appNavClick: () => undefined,
    appObjectId: () => undefined,
    appAction: () => undefined,
    auth: { getUser: () => undefined, getToken: () => Promise.resolve('') },
    getBundle: () => 'iam',
    getApp: () => 'user-access',
    ...chromeConfig
  };
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