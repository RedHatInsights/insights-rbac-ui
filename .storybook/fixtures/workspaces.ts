import type { WorkspacesWorkspace } from '../../src/data/queries/workspaces';

// Type alias for backward compatibility
type Workspace = WorkspacesWorkspace;

/**
 * Default workspaces fixture for testing
 * Includes a root workspace and two child workspaces
 */
export const defaultWorkspaces: Workspace[] = [
  {
    id: 'root-1',
    name: 'Default Workspace',
    description: 'Root workspace for the organization',
    parent_id: null as any, // Root workspace has no parent
    type: 'root',
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ws-1',
    name: 'Production',
    description: 'Production environment workspace',
    parent_id: 'root-1',
    type: 'standard',
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'ws-2',
    name: 'Development',
    description: 'Development environment workspace',
    parent_id: 'root-1',
    type: 'standard',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'ws-3',
    name: 'Staging',
    description: 'Staging environment workspace',
    parent_id: 'root-1',
    type: 'standard',
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

