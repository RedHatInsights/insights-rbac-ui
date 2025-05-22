export {};
declare global {
  type RBACStore = {
    userReducer: UserStore;
    groupReducer: GroupStore;
    roleReducer: RoleStore;
    workspacesReducer: WorkspacesStore;
    permissionReducer: any;
  };
}
