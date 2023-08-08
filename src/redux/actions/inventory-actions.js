import * as ActionTypes from '../action-types';
import * as InventoryHelper from '../../helpers/role/inventory-helper';

export const fetchInventoryGroups = (permissions, config) => ({
  type: ActionTypes.FETCH_INVENTORY_GROUP,
  meta: { permissions, config },
  payload: InventoryHelper.getInventoryGroups(config),
});
