import * as ActionTypes from '../action-types';
import * as WorkspacesHelper from '../../helpers/workspaces/workspaces-helper';

export const fetchWorkspaces = () => ({
  type: ActionTypes.FETCH_WORKSPACES,
  payload: WorkspacesHelper.getWorkspaces(),
});

export const fetchWorkspace = (ws: string) => ({
  type: ActionTypes.FETCH_WORKSPACE,
  payload: WorkspacesHelper.getWorkspace(ws),
});
