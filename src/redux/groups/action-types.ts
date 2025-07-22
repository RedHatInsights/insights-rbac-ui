// Group core actions
export const FETCH_GROUP = 'FETCH_GROUP' as const;
export const FETCH_ADMIN_GROUP = 'FETCH_ADMIN_GROUP' as const;
export const FETCH_SYSTEM_GROUP = 'FETCH_SYSTEM_GROUP' as const;
export const INVALIDATE_SYSTEM_GROUP = 'INVALIDATE_SYSTEM_GROUP' as const;
export const FETCH_GROUPS = 'FETCH_GROUPS' as const;

export const ADD_GROUP = 'ADD_GROUP' as const;
export const UPDATE_GROUP = 'UPDATE_GROUP' as const;
export const REMOVE_GROUPS = 'REMOVE_GROUPS' as const;
export const UPDATE_GROUPS_FILTERS = 'UPDATE_GROUPS_FILTERS' as const;
export const RESET_SELECTED_GROUP = 'RESET_SELECTED_GROUP' as const;

// Group members
export const ADD_MEMBERS_TO_GROUP = 'ADD_MEMBERS_TO_GROUP' as const;
export const REMOVE_MEMBERS_FROM_GROUP = 'REMOVE_MEMBERS_FROM_GROUP' as const;
export const FETCH_MEMBERS_FOR_GROUP = 'FETCH_MEMBERS_FOR_GROUP' as const;
export const FETCH_MEMBERS_FOR_EXPANDED_GROUP = 'FETCH_MEMBERS_FOR_EXPANDED_GROUP' as const;

// Group roles
export const ADD_ROLES_TO_GROUP = 'ADD_ROLES_TO_GROUP' as const;
export const REMOVE_ROLES_FROM_GROUP = 'REMOVE_ROLES_FROM_GROUP' as const;
export const FETCH_ROLES_FOR_GROUP = 'FETCH_ROLES_FOR_GROUP' as const;
export const FETCH_ROLES_FOR_EXPANDED_GROUP = 'FETCH_ROLES_FOR_EXPANDED_GROUP' as const;
export const FETCH_ADD_ROLES_FOR_GROUP = 'FETCH_ADD_ROLES_FOR_GROUP' as const;

// Group service accounts
export const ADD_SERVICE_ACCOUNTS_TO_GROUP = 'ADD_SERVICE_ACCOUNTS_TO_GROUP' as const;
export const REMOVE_SERVICE_ACCOUNTS_FROM_GROUP = 'REMOVE_SERVICE_ACCOUNTS_FROM_GROUP' as const;
export const FETCH_SERVICE_ACCOUNTS_FOR_GROUP = 'FETCH_SERVICE_ACCOUNTS_FOR_GROUP' as const;
