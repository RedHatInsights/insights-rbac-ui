/**
 * Shared types for Storybook decorator arguments
 * These can be used across all stories to ensure consistency
 */

// Permissions decorator arguments
export interface PermissionsArgs {
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
}

// Chrome decorator arguments  
export interface ChromeArgs {
  environment?: 'prod' | 'stage' | 'ci-beta' | 'ci-stable' | 'qa-beta' | 'qa-stable';
}

// Feature flags decorator arguments
export interface FeatureFlagsArgs {
  'platform.rbac.itless'?: boolean;
  // Add other specific feature flags as needed
}

// Combined decorator arguments
export interface DecoratorArgs extends PermissionsArgs, ChromeArgs, FeatureFlagsArgs {}

// Utility type to create story args by extending component props with decorator args
export type StoryArgs<T = {}> = T & DecoratorArgs;

// Default values for decorator arguments
export const DEFAULT_DECORATOR_ARGS: DecoratorArgs = {
  orgAdmin: false,
  userAccessAdministrator: false,
  environment: 'prod',
  'platform.rbac.itless': false,
};

// ArgTypes configuration for decorator controls
export const DECORATOR_ARG_TYPES = {
  // Permissions controls
  orgAdmin: {
    control: 'boolean',
    description: 'Organization admin permissions',
    table: {
      category: 'Permissions',
    },
  },
  userAccessAdministrator: {
    control: 'boolean',
    description: 'User access administrator permissions',
    table: {
      category: 'Permissions',
    },
  },
  // Chrome controls
  environment: {
    control: 'select',
    options: ['prod', 'stage', 'ci-beta', 'ci-stable', 'qa-beta', 'qa-stable'],
    description: 'Environment for Chrome API',
    table: {
      category: 'Chrome',
    },
  },
  // Feature flags controls
  'platform.rbac.itless': {
    control: 'boolean',
    description: 'ITLess mode feature flag',
    table: {
      category: 'Feature Flags',
    },
  },
} as const; 