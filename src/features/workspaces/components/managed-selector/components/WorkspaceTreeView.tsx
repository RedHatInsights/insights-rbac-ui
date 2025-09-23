import React from 'react';
import { useIntl } from 'react-intl';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { AlertVariant } from '@patternfly/react-core';
import { Bullseye } from '@patternfly/react-core';

export interface Workspace {
  id: string;
  parent_id?: string;
  type: string;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}

export interface TreeViewWorkspaceItem extends TreeViewDataItem {
  parentTreeViewItem?: TreeViewWorkspaceItem;
  workspace: Workspace;
}

interface WorkspaceTreeViewProps {
  treeElements: TreeViewWorkspaceItem[];
  areElementsFiltered: boolean;
  selectedWorkspace?: TreeViewWorkspaceItem;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  isLoading: boolean;
  isError: boolean;
}

export const WorkspaceTreeView: React.FC<WorkspaceTreeViewProps> = ({
  treeElements,
  areElementsFiltered,
  selectedWorkspace,
  onSelect,
  isLoading,
  isError,
}) => {
  const intl = useIntl();

  if (isError) {
    return (
      <Alert
        data-testid="workspace-load-error"
        variant={AlertVariant.danger}
        title={intl.formatMessage({
          id: 'workspaceTreeViewError',
          description: 'Error loading workspaces in tree view',
          defaultMessage: 'Failed to load workspaces',
        })}
      />
    );
  }

  if (isLoading) {
    return (
      <Bullseye data-testid="workspace-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (treeElements.length > 0) {
    return (
      <TreeView
        activeItems={selectedWorkspace ? [selectedWorkspace] : []}
        allExpanded={areElementsFiltered}
        data={treeElements}
        hasGuides
        onSelect={onSelect}
        hasSelectableNodes={true}
      />
    );
  }

  return (
    <p data-testid="workspace-empty-message">
      {areElementsFiltered
        ? intl.formatMessage({
            id: 'workspaceTreeViewNoSearchResults',
            description: 'Message when no workspaces match search',
            defaultMessage: 'No workspaces match your search.',
          })
        : intl.formatMessage({
            id: 'workspaceTreeViewNoWorkspaces',
            description: 'Message when no workspaces are available',
            defaultMessage: 'No workspaces to show.',
          })}
    </p>
  );
};
