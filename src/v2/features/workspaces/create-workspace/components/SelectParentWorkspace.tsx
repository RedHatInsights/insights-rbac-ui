import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import type { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Stack } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import { type WorkspacesWorkspace } from '../../../../data/queries/workspaces';
import { WorkspacesWorkspaceTypes } from '../../../../data/api/workspaces';
import { InlineWorkspacePicker } from '../../components/managed-selector/InlineWorkspacePicker';
import { type TreeViewWorkspaceItem } from '../../components/managed-selector/TreeViewWorkspaceItem';
import { canCreateInType } from '../../workspaceTypes';
import { WORKSPACE_PARENT } from '../schema';

/**
 * DDF custom component that wraps InlineWorkspacePicker for the create-workspace wizard.
 * Syncs tree selection to the DDF form field WORKSPACE_PARENT.
 */
export const SelectParentWorkspace: React.FC<UseFieldApiConfig> = (props) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { input } = useFieldApi(props);

  const parentFromForm = formOptions.getState().values[WORKSPACE_PARENT] as WorkspacesWorkspace | undefined;

  // Clear pre-selected parent if its type is not creatable
  useEffect(() => {
    if (parentFromForm?.type && !canCreateInType(parentFromForm.type)) {
      formOptions.change(WORKSPACE_PARENT, undefined);
      input.onChange(undefined);
    }
  }, [parentFromForm?.type, formOptions, input]);

  const selectedWorkspace = useMemo<TreeViewWorkspaceItem | undefined>(() => {
    if (!parentFromForm?.id || !parentFromForm.name || !parentFromForm.type) return undefined;
    const validTypes: string[] = Object.values(WorkspacesWorkspaceTypes);
    if (!validTypes.includes(parentFromForm.type)) return undefined;
    return {
      name: parentFromForm.name,
      id: parentFromForm.id,
      workspace: {
        id: parentFromForm.id,
        name: parentFromForm.name,
        description: parentFromForm.description,
        type: parentFromForm.type as WorkspacesWorkspaceTypes,
        parent_id: parentFromForm.parent_id ?? undefined,
      },
      children: [],
    };
  }, [parentFromForm]);

  const handleSelect = useCallback(
    (workspace: TreeViewWorkspaceItem | null) => {
      if (!workspace) {
        formOptions.change(WORKSPACE_PARENT, undefined);
        input.onChange(undefined);
        return;
      }
      const workspaceForForm = {
        id: workspace.workspace.id,
        parent_id: workspace.workspace.parent_id,
        type: workspace.workspace.type,
        name: workspace.workspace.name,
        description: workspace.workspace.description,
      } as WorkspacesWorkspace;
      formOptions.change(WORKSPACE_PARENT, workspaceForForm);
      input.onChange(workspaceForForm);
      input.onBlur();
    },
    [formOptions, input],
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
      <StackItem isFilled>
        <InlineWorkspacePicker requiredPermission="create" selectedWorkspace={selectedWorkspace} onSelect={handleSelect} allExpanded />
      </StackItem>
    </Stack>
  );
};
