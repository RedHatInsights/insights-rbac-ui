import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import type { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Stack } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import { type WorkspaceWithPermissions } from '../../../../data/queries/workspaces';
import { type WorkspacesWorkspace } from '../../../../data/queries/workspaces';
import buildWorkspaceTree from '../../components/managed-selector/WorkspaceTreeBuilder';
import { filterWorkspaceItem } from '../../components/managed-selector/ManagedWorkspaceSelector';
import { type TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from '../../components/managed-selector/TreeViewWorkspaceItem';
import { WorkspaceTreeView } from '../../components/managed-selector/components/WorkspaceTreeView';
import { useWorkspacesWithPermissions } from '../../hooks/useWorkspacesWithPermissions';
import { canCreateInType } from '../../workspaceTypes';
import { WORKSPACE_PARENT } from '../schema';

export const SelectParentWorkspace: React.FC<UseFieldApiConfig> = (props) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { input } = useFieldApi(props);

  const { workspaces, status, isError } = useWorkspacesWithPermissions({ limit: 10000 });
  const isTreeLoading = status !== 'ready';

  const [searchInputValue, setSearchInputValue] = useState('');

  const parentFromForm = formOptions.getState().values[WORKSPACE_PARENT] as WorkspacesWorkspace | undefined;

  // Build disabled IDs set (workspaces where user lacks create permission)
  const disabledIds = useMemo<Set<string>>(() => {
    if (status !== 'ready') return new Set();
    return new Set(workspaces.filter((ws: WorkspaceWithPermissions) => !ws.permissions.create).map((ws) => ws.id));
  }, [workspaces, status]);

  // Clear pre-selected parent once permissions settle if it's no longer valid
  useEffect(() => {
    if (!parentFromForm) return;

    const invalidType = !canCreateInType(parentFromForm.type);
    const forbiddenParent = !!parentFromForm.id && disabledIds.has(parentFromForm.id);

    if (invalidType || forbiddenParent) {
      formOptions.change(WORKSPACE_PARENT, undefined);
      input.onChange(undefined);
    }
  }, [disabledIds, formOptions, input, parentFromForm]);

  const disabledTooltip = useMemo(
    () =>
      intl.formatMessage(
        {
          id: 'workspaceSelectorDisabledTooltip',
          description: 'Tooltip shown on disabled workspace tree items when the user lacks the required permission',
          defaultMessage: 'You do not have {permission} permission on this workspace',
        },
        { permission: 'create' },
      ),
    [intl],
  );

  // Build workspace tree from flat list
  const workspaceTree = useMemo(() => {
    if (workspaces.length === 0) return undefined;
    const convertedWorkspaces = workspaces.map((ws: WorkspaceWithPermissions) => ({
      id: ws.id,
      parent_id: ws.parent_id ?? undefined,
      type: ws.type,
      name: ws.name,
      description: ws.description,
      created: ws.created,
      updated: ws.modified,
    }));
    return buildWorkspaceTree(convertedWorkspaces);
  }, [workspaces]);

  const filteredTreeElements = useMemo(() => {
    if (!workspaceTree) return [] as TreeViewWorkspaceItem[];
    const trimmed = searchInputValue.trim();
    if (!trimmed) return [workspaceTree];
    const filteredRoot = filterWorkspaceItem(workspaceTree, trimmed);
    return filteredRoot ? [filteredRoot] : [];
  }, [workspaceTree, searchInputValue]);

  // Derive the selected TreeViewWorkspaceItem from form state
  const selectedWorkspace = useMemo<TreeViewWorkspaceItem | undefined>(() => {
    if (!parentFromForm?.id) return undefined;
    return {
      name: parentFromForm.name ?? '',
      id: parentFromForm.id,
      workspace: {
        id: parentFromForm.id,
        name: parentFromForm.name ?? '',
        description: parentFromForm.description,
        type: parentFromForm.type as import('../../../../data/api/workspaces').WorkspacesWorkspaceTypes,
        parent_id: parentFromForm.parent_id ?? '',
      },
      children: [],
    };
  }, [parentFromForm]);

  const onSelect = useCallback(
    (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
      if (!instanceOfTreeViewWorkspaceItem(selectedItem)) return;
      if (selectedItem.id && disabledIds.has(selectedItem.id)) return;

      const workspaceForForm = {
        id: selectedItem.workspace.id,
        parent_id: selectedItem.workspace.parent_id,
        type: selectedItem.workspace.type,
        name: selectedItem.workspace.name,
        description: selectedItem.workspace.description,
      } as WorkspacesWorkspace;

      formOptions.change(WORKSPACE_PARENT, workspaceForForm);
      input.onChange(workspaceForForm);
      input.onBlur();
    },
    [disabledIds, formOptions, input],
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(messages.selectParentWorkspace)}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p">{intl.formatMessage(messages.selectParentWorkspaceDescription)}</Content>
      </StackItem>
      <StackItem>
        <SearchInput
          placeholder={intl.formatMessage(messages.searchWorkspaces)}
          value={searchInputValue}
          onChange={(_event, value) => setSearchInputValue(value)}
          onClear={() => setSearchInputValue('')}
          aria-label={intl.formatMessage(messages.searchWorkspaces)}
        />
      </StackItem>
      <StackItem isFilled>
        <WorkspaceTreeView
          treeElements={filteredTreeElements}
          areElementsFiltered={true}
          selectedWorkspace={selectedWorkspace}
          onSelect={onSelect}
          isLoading={isTreeLoading}
          isError={isError}
          disabledIds={disabledIds}
          disabledTooltip={disabledTooltip}
        />
      </StackItem>
    </Stack>
  );
};
