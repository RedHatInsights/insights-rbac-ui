import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceType from './WorkspaceType';
import { WorkspacePermissionsObject, canViewWorkspaceById } from './WorkspacePermissions';
import { Text } from '@patternfly/react-core';
import React from 'react';

export default function buildWorkspaceTree(
  wps: Workspace[],
  workspacePermissions?: WorkspacePermissionsObject,
  excludeWorkspaceIds?: string[],
): TreeViewWorkspaceItem | undefined {
  if (wps.length == 0) {
    return undefined;
  }

  // Build complete list of workspace IDs to exclude (specified IDs + their descendants)
  const allExcludeIds = new Set<string>();
  if (excludeWorkspaceIds) {
    for (const excludeId of excludeWorkspaceIds) {
      allExcludeIds.add(excludeId);
      const descendantIds = getWorkspaceDescendantIds(excludeId, wps);
      descendantIds.forEach((id) => allExcludeIds.add(id));
    }
  }

  // Filter out excluded workspaces before building tree
  const filteredWorkspaces = wps.filter((ws) => !allExcludeIds.has(ws.id));

  // Convert all the filtered workspaces to TreeViewWorkspaceItems, and
  // identify the root workspace.
  const workspaces: TreeViewWorkspaceItem[] = [];
  let rootWorkspace: TreeViewWorkspaceItem | undefined = undefined;

  for (const workspace of filteredWorkspaces) {
    const isDisabled = workspacePermissions ? !canViewWorkspaceById(workspace.id, workspacePermissions) : false;    
    const tvwi: TreeViewWorkspaceItem = {
      id: workspace.id,
      name: <Text className={!isDisabled ? 'pf-v6-u-text-color-disabled' : ''} onClick={e => { e.stopPropagation(); e}}>{workspace.name}</Text>,
      workspace: workspace,
    };

    workspaces.push(tvwi);

    // Get the root workspace. The Kessel team has confirmed that there only
    // exists one root workspace per organization. Take the first one found.
    if (tvwi.workspace.type === WorkspaceType.ROOT && rootWorkspace === undefined) {
      rootWorkspace = tvwi;
    }

    // A workspace without a parent ID should be a "root" workspace. In the
    // extremely rare case where there is a non-root workspace without a parent
    // ID, we should just log it to help figure out why an incomplete list of
    // workspaces might be shown.
    if (tvwi.workspace.parent_id === undefined && tvwi.workspace.type !== WorkspaceType.ROOT) {
      console.warn(
        `WARNING: non-root workspace has no parent ID. It will not be added to the root workspace and might seem like it is missing: ${JSON.stringify(tvwi.workspace)}`,
      );
    }
  }

  // There should always exist a root workspace.
  if (rootWorkspace === undefined) {
    return undefined;
  }

  // Push the root workspace to the nodes that we are about to traverse.
  const nodes: TreeViewWorkspaceItem[] = [rootWorkspace];
  while (nodes.length > 0) {
    const node = nodes.pop();

    // Find all the children workspaces of the given node by looping through
    // all the available workspaces.
    for (const workspace of workspaces) {
      if (workspace.workspace.parent_id && workspace.workspace.parent_id === node?.id) {
        // Initialize the node's children in case it is not already.
        if (!node.children) {
          node.children = [];
        }

        // Link every child to its parent.
        workspace.parentTreeViewItem = node;

        // Add the workspace to the current node's children.
        node.children?.push(workspace);

        // Push the children to the list of nodes we need to find the children
        // for, to find the subtrees for each chidlren.
        nodes.push(workspace);
      }
    }
  }

  return rootWorkspace;
}

export function getWorkspaceDescendants(workspaceId: string, workspaces: Workspace[]): Workspace[] {
  const descendants: Workspace[] = [];

  const directChildren = workspaces.filter((ws) => ws.parent_id === workspaceId);

  for (const child of directChildren) {
    descendants.push(child);
    descendants.push(...getWorkspaceDescendants(child.id, workspaces));
  }
  return descendants;
}

export function getWorkspaceDescendantIds(workspaceId: string, workspaces: Workspace[]): string[] {
  const descendants = getWorkspaceDescendants(workspaceId, workspaces);
  return descendants.map((ws) => ws.id);
}
