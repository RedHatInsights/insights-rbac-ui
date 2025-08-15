import * as ActionTypes from '../action-types';
import * as InventoryHelper from '../../helpers/role/inventory-helper';

export const fetchInventoryGroups = (permissions, config) => ({
  type: ActionTypes.FETCH_INVENTORY_GROUPS,
  meta: { permissions, config },
  payload: InventoryHelper.getInventoryGroups(config),
});

export const fetchInventoryGroupsDetails = (groupsIds) => {
  return {
    type: ActionTypes.FETCH_INVENTORY_GROUPS_DETAILS,
    meta: { groupsIds },
    payload: InventoryHelper.getInventoryGroupsDetails(groupsIds.filter((item) => item?.length > 0)),
  };
};
