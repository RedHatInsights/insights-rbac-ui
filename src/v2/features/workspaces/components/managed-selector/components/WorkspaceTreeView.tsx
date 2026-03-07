import React from 'react';
import { useIntl } from 'react-intl';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
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
  /** Set of workspace IDs that should be rendered as disabled (non-selectable) */
  disabledIds?: Set<string>;
  /** Tooltip text shown on hover over disabled tree items (explains why the item is disabled) */
  disabledTooltip?: string;
}

/**
 * Recursively annotate tree items with disabled styling and an explanatory tooltip.
 * Disabled items get reduced opacity, a `not-allowed` cursor, and – when a tooltip
 * message is provided – a PatternFly Tooltip that explains why the item is disabled.
 */
function annotateDisabledItems(items: TreeViewWorkspaceItem[], disabledIds: Set<string>, tooltip?: string): TreeViewWorkspaceItem[] {
  return items.map((item) => {
    const isDisabled = !!(item.id && disabledIds.has(item.id));
    const annotatedChildren = item.children ? annotateDisabledItems(item.children as TreeViewWorkspaceItem[], disabledIds, tooltip) : undefined;

    if (!isDisabled && !annotatedChildren) return item;

    const disabledName = isDisabled
      ? (() => {
          const inner = React.createElement('span', { style: { opacity: 0.5, cursor: 'not-allowed' } }, item.name);
          return tooltip ? React.createElement(Tooltip, { content: tooltip }, inner) : inner;
        })()
      : undefined;

    return {
      ...item,
      ...(annotatedChildren ? { children: annotatedChildren } : {}),
      ...(disabledName !== undefined ? { name: disabledName } : {}),
    };
  });
}

export const WorkspaceTreeView: React.FC<WorkspaceTreeViewProps> = ({
  treeElements,
  areElementsFiltered,
  selectedWorkspace,
  onSelect,
  isLoading,
  isError,
  disabledIds,
  disabledTooltip,
}) => {
  const intl = useIntl();

  // Annotate tree items with disabled styling + tooltip when disabledIds is provided
  const displayElements = React.useMemo(() => {
    if (!disabledIds || disabledIds.size === 0) return treeElements;
    return annotateDisabledItems(treeElements, disabledIds, disabledTooltip);
  }, [treeElements, disabledIds, disabledTooltip]);

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

  if (displayElements.length > 0) {
    return (
      <TreeView
        activeItems={selectedWorkspace ? [selectedWorkspace] : []}
        allExpanded={areElementsFiltered}
        data={displayElements}
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
