import { getAxiosInstance } from '../../helpers/shared/user-login';
import { EXPERIMENTAL_GET_GROUP_ENTITY, EXPERIMENTAL_GROUPS_PAGINATED } from './groups-reducer';

const generateQuery = (base, params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (typeof val !== 'object' && typeof val !== 'undefined') {
      search.append(key, val);
    }
  });
  const query = search.toString();
  return `${base}${query.length > 0 ? `?${search.toString()}` : ''}`;
};

const createAction = (baseUrl, { filters, entityId, ...params } = {}, options) => {
  const query = generateQuery(baseUrl, params);
  return {
    meta: {
      query,
      entityId,
    },
    prefferCache: true,
    reducer: 'experimentalGroupsReducer',
    reqType: options.reqType,
    req: () =>
      getAxiosInstance()({
        url: generateQuery(baseUrl, params),
        ...options,
      }).then((response) => ({
        ...response,
        filters,
        pagination: {
          ...response?.meta,
          offset: params.offset,
          limit: params.limit,
        },
      })),
  };
};

export const experimentalFetchGroup = (uuid) => ({
  type: EXPERIMENTAL_GET_GROUP_ENTITY,
  ...createAction(`/api/rbac/v1/groups/${uuid}/`, { entityId: uuid }, { reqType: 'entity' }),
});

export const experimentalFetchGroups = (params = {}, options = {}) => ({
  type: EXPERIMENTAL_GROUPS_PAGINATED,
  ...createAction('/api/rbac/v1/groups/', params, { ...options, reqType: 'list' }),
});
