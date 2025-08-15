import * as ActionTypes from '../action-types';
import * as CostHelper from '../../helpers/cost-management/cost-management-helper';

export const fetchResourceDefinitions = (apiProps) => ({
  type: ActionTypes.FETCH_RESOURCE_DEFINITIONS,
  payload: CostHelper.getResourceDefinitions(apiProps),
});

export const fetchResource = (apiProps) => ({
  type: ActionTypes.FETCH_RESOURCE,
  payload: CostHelper.getResource(apiProps),
});
