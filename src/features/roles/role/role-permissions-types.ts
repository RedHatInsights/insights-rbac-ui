export interface RolePermissionsState {
  pagination: {
    limit: number;
    offset: number;
    count?: number;
  };
  selectedPermissions: Array<{ uuid: string }>;
  showRemoveModal: boolean;
  confirmDelete: () => void;
  deleteInfo: {
    title?: string;
    text?: React.ReactNode;
    confirmButtonLabel?: string;
  };
  filters: {
    applications: string[];
    resources: string[];
    operations: string[];
  };
  isToggled: boolean;
  resources: Array<{ label: string; value: string }>;
  operations: Array<{ label: string; value: string }>;
}

export type RolePermissionsAction =
  | { type: 'SET_PAGINATION'; limit: number; offset: number }
  | { type: 'SELECT_PERMISSIONS'; selection: Array<{ uuid: string }> }
  | { type: 'SHOW_REMOVE_MODAL'; showRemoveModal: boolean }
  | { type: 'SUBMIT_REMOVE_MODAL' }
  | {
      type: 'INITIATE_REMOVE_PERMISSION';
      confirmDelete: () => void;
      deleteInfo: {
        title: string;
        text: React.ReactNode;
        confirmButtonLabel: string;
      };
    }
  | {
      type: 'SET_FILTERS';
      applications?: string[];
      resources?: string[];
      operations?: string[];
    }
  | { type: 'SET_TOGGLED' }
  | {
      type: 'INITIALIZE_ROLE';
      resources: Array<{ label: string; value: string }>;
      operations: Array<{ label: string; value: string }>;
      count: number;
    };
