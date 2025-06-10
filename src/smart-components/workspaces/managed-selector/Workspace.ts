import WorkspaceType from './WorkspaceType';

/**
 * Represents a Workspace object.
 */
interface Workspace {
  id: string;
  parent_id?: string;
  type: WorkspaceType;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}

export const isWorkspace = (obj: unknown): obj is Workspace => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (!('id' in obj) || typeof (obj as Workspace).id !== 'string') {
    return false;
  }
  if (!('type' in obj) || !Object.values(WorkspaceType).includes((obj as Workspace).type)) {
    return false;
  }
  if (!('name' in obj) || typeof (obj as Workspace).name !== 'string') {
    return false;
  }
  return true;
};

export default Workspace;
