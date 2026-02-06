import React, { type ReactNode, createContext, useContext } from 'react';

export type Environment = 'production' | 'staging';

/**
 * Mock entitlements for auth.getUser() responses
 */
export interface MockEntitlements {
  [key: string]: {
    is_entitled?: boolean;
    is_trial?: boolean;
  };
}

/**
 * Mock user identity for auth.getUser() responses
 */
export interface MockUserIdentity {
  account_number?: string;
  org_id?: string;
  user?: {
    is_org_admin?: boolean;
    username?: string;
    email?: string;
    is_internal?: boolean;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    locale?: string;
  };
  organization?: {
    name?: string;
  };
  internal?: {
    account_id?: string;
    cross_access?: boolean;
  };
  entitlements?: MockEntitlements;
}

export interface MockState {
  environment: Environment;
  isOrgAdmin: boolean;
  permissions: string[];
  workspacePermissions: {
    edit: string[]; // workspace IDs user can edit
    create: string[]; // workspace IDs user can create in
  };
  /** Optional custom user identity for auth.getUser() */
  userIdentity?: MockUserIdentity;
}

const defaultState: MockState = {
  environment: 'staging',
  isOrgAdmin: false,
  permissions: [],
  workspacePermissions: { edit: [], create: [] },
};

export const StorybookMockContext = createContext<MockState>(defaultState);

interface ProviderProps extends Partial<MockState> {
  children: ReactNode;
}

export const StorybookMockProvider: React.FC<ProviderProps> = ({
  children,
  environment = 'staging',
  isOrgAdmin = false,
  permissions = [],
  workspacePermissions = { edit: [], create: [] },
  userIdentity,
}) => {
  const value: MockState = { environment, isOrgAdmin, permissions, workspacePermissions, userIdentity };
  return <StorybookMockContext.Provider value={value}>{children}</StorybookMockContext.Provider>;
};

export const useMockState = () => useContext(StorybookMockContext);
