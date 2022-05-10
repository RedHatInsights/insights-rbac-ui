import { getAxiosInstance } from '../../helpers/shared/user-login';
import { EXPERIMENTAL_GROUPS_PAGINATED } from './groups-reducer';

const generateQuery = (base, params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (typeof val !== 'object' && typeof val !== 'undefined') {
      search.append(key, val);
    }
  });
  return `${base}?${search.toString()}`;
};

const createAction = (baseUrl, { filters, ...params }, options) => {
  const query = generateQuery(baseUrl, params);
  return {
    meta: {
      query,
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

export const experimentalFetchGroups = (params = {}, options = {}) => ({
  type: EXPERIMENTAL_GROUPS_PAGINATED,
  ...createAction('/api/rbac/v1/groups/', params, { ...options, reqType: 'list' }),
});
