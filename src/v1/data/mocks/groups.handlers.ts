/**
 * V1 groups handler factory.
 * Re-exports from shared — groups API is shared between V1 and V2.
 */
export {
  createGroupsHandlers,
  groupsHandlers,
  groupsErrorHandlers,
  groupsLoadingHandlers,
  type GroupsHandlerOptions,
} from '../../../shared/data/mocks/groups.handlers';
