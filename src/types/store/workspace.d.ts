export {};
declare global {
  interface WorkspaceCreateBody {
    id?: string;
    name: string;
    description: string;
    children?: Workspace[];
    parent_id?: string;
  }

  interface Workspace extends WorkspaceCreateBody {
    id: string;
    type: 'standard' | 'default' | 'root';
    parent_id: string;
  }

  interface WorkspacesStore {
    isLoading: boolean;
    workspaces: Workspace[];
    error: string;
    selectedWorkspace: Workspace;
  }
}
