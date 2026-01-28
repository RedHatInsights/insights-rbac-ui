import { WorkspacesWorkspaceTypes } from '@redhat-cloud-services/rbac-client/v2/types';

/**
 * Represents a Workspace object.
 */
interface Workspace {
  id: string;
  parent_id?: string;
  type: WorkspacesWorkspaceTypes;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}

const VALID_WORKSPACE_TYPES: string[] = Object.values(WorkspacesWorkspaceTypes);

export const isWorkspace = (obj: unknown): obj is Workspace => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (!('id' in obj) || typeof (obj as Workspace).id !== 'string') {
    return false;
  }
  if (!('type' in obj) || !VALID_WORKSPACE_TYPES.includes((obj as Workspace).type)) {
    return false;
  }
  if (!('name' in obj) || typeof (obj as Workspace).name !== 'string') {
    return false;
  }
  return true;
};

export default Workspace;
