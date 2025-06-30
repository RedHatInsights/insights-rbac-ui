import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import * as React from 'react';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { Alert, AlertVariant, Bullseye } from '@patternfly/react-core';

interface WorkspaceTreeViewProps {
  treeElements: TreeViewWorkspaceItem[];
  areElementsFiltered: boolean;
  selectedWorkspace?: TreeViewWorkspaceItem;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  isLoading: boolean;
  isError: boolean;
}

const WorkspaceTreeView = ({ treeElements, areElementsFiltered, selectedWorkspace, onSelect, isLoading, isError }: WorkspaceTreeViewProps) => {
  if (isError) {
    return <Alert data-testid="workspace-load-error" variant={AlertVariant.danger} title="Failed to load workspaces" />;
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
        className="workspace-selector-tree-view"
      />
    );
  }

  return <p data-testid="workspace-empty-message">{areElementsFiltered ? 'No workspaces match your search.' : 'No workspaces to show.'}</p>;
};

export default WorkspaceTreeView;
