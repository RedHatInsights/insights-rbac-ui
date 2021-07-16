import * as ActionTypes from '../action-types';
import * as CostHelper from '../../helpers/cost-management/cost-management-helper';

export const getResourceDefinitions = (apiProps) => ({
  type: ActionTypes.GET_RESOURCE_DEFINITIONS,
  payload: CostHelper.getResourceDefinitions(apiProps),
});

export const getResource = (apiProps) => ({
  type: ActionTypes.GET_RESOURCE,
  payload: CostHelper.getResource(apiProps),
});
