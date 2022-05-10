import { defaultSettings } from '../../helpers/shared/pagination';

const STORAGE_TOMEOUT = 10 * 60 * 1000;
export const EXPERIMENTAL_GROUPS_PAGINATED = '@@rbac/experimental/groups/paginated';
export const EXPERIMENTAL_UPDATE_GROUP_ENTITY = '@@rbac/experimental/group/entity/update';

export const experimentalGroupsReducerInitialState = {
  storage: {
    pages: {},
    entities: {},
  },
  groups: {
    data: [],
    meta: defaultSettings,
    filters: {},
    pagination: { ...defaultSettings, count: 0 },
  },
  selectedGroup: { addRoles: {}, members: { meta: defaultSettings }, pagination: defaultSettings },
  isLoading: false,
  isRecordLoading: false,
};

const setGroups = (state, { payload }) => ({
  ...state,
  groups: payload,
});

const updateGroup = (state, { payload }) => {
  const newGroup = { ...payload, expiration: Date.now() + STORAGE_TOMEOUT };
  return {
    ...state,
    groups: {
      ...state.groups,
      data: state.groups.data.map((group) => (group.uuid === newGroup.uuid ? newGroup : group)),
    },
    storage: {
      ...state.storage,
      entities: {
        ...state.storage.entities,
        [payload.uuid]: newGroup,
      },
    },
  };
};

const storePaginatedData = (state, { payload: { data, ...rest }, meta: { query } }) => {
  const expiration = Date.now() + STORAGE_TOMEOUT;
  console.log({ data, rest, query });
  return {
    ...state,
    isLoading: false,
    groups: {
      ...state.groups,
      ...rest,
      data,
    },
    storage: {
      pages: {
        ...state?.storage?.pages,
        [query]: {
          entities: data.map(({ uuid }) => uuid),
          expiration,
          ...rest,
        },
      },
      entities: data.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.uuid]: {
            ...curr,
            expiration,
          },
        }),
        state?.storage?.entities
      ),
    },
  };
};

const setLoadingState = (state) => ({ ...state, error: undefined, isLoading: true });

const experimentalGroupsReducer = {
  [`${EXPERIMENTAL_GROUPS_PAGINATED}_PENDING`]: setLoadingState,
  [`${EXPERIMENTAL_GROUPS_PAGINATED}_FULFILLED`]: storePaginatedData,
  [`${EXPERIMENTAL_GROUPS_PAGINATED}_SET`]: setGroups,
  [EXPERIMENTAL_UPDATE_GROUP_ENTITY]: updateGroup,
};

export default experimentalGroupsReducer;
