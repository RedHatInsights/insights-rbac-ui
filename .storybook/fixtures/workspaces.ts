import { Workspace } from '../../src/redux/workspaces/reducer';

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
  },
  {
    id: 'ws-1',
    name: 'Production',
    description: 'Production environment workspace',
    parent_id: 'root-1',
    type: 'standard',
  },
  {
    id: 'ws-2',
    name: 'Development',
    description: 'Development environment workspace',
    parent_id: 'root-1',
    type: 'standard',
  },
  {
    id: 'ws-3',
    name: 'Staging',
    description: 'Staging environment workspace',
    parent_id: 'root-1',
    type: 'standard',
  },
];

