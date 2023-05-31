import * as ActionTypes from '../action-types';
import * as InventoryHelper from '../../helpers/role/inventory-helper';

export const fetchInventoryGroups = () => ({
  type: ActionTypes.FETCH_INVENTORY_GROUP,
  payload: InventoryHelper.getInventoryGroups(),
});
