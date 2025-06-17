import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import * as React from 'react';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { Bullseye } from '@patternfly/react-core';

interface WorkspaceTreeViewProps {
  treeElements: TreeViewWorkspaceItem[];
  areElementsFiltered: boolean;
  selectedWorkspace?: TreeViewWorkspaceItem;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  isLoading: boolean;
}

const WorkspaceTreeView = ({ treeElements, areElementsFiltered, selectedWorkspace, onSelect, isLoading }: WorkspaceTreeViewProps) => {
  if (isLoading) {
    return (
      <Bullseye>
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
        hasGuides={true}
        onSelect={onSelect}
        className='workspace-selector-tree-view'
      />
    );
  } else {
    return <p>No workspaces to show.</p>;
  }
};

export default WorkspaceTreeView;
