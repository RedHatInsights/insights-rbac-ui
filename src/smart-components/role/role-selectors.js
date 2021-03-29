export const roleSelector = (state, roleId) => {
  const {
    roleReducer: { roles = { data: [] }, selectedRole },
  } = state;
  if (selectedRole?.uuid === roleId) {
    return selectedRole;
  }

  return roles.data.find(({ uuid }) => uuid === roleId);
};

export const roleNameSelector = (state, roleId) => roleSelector(state, roleId)?.display_name;
