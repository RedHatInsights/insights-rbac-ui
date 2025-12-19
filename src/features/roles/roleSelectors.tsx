import type { RBACStore } from '../../redux/store.d';

interface Role {
  uuid: string;
  display_name?: string;
  [key: string]: unknown;
}

export const roleSelector = (state: RBACStore, roleId: string): Role | undefined => {
  const {
    roleReducer: { roles = { data: [] }, selectedRole },
  } = state;
  if (selectedRole?.uuid === roleId) {
    return selectedRole as unknown as Role;
  }

  return (roles.data as Role[]).find(({ uuid }) => uuid === roleId);
};

export const roleNameSelector = (state: RBACStore, roleId: string): string | undefined => roleSelector(state, roleId)?.display_name;
