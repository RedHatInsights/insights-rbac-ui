import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormSelect } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { FormSelectOption } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { useFlag } from '@unleash/proxy-client-react';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import InputHelpPopover from '../../../../../shared/components/forms/InputHelpPopover';
import { useWorkspacesFlag } from '../../../../../shared/hooks/useWorkspacesFlag';
import { useWorkspacesQuery } from '../../../../data/queries/workspaces';

import { ManagedWorkspaceSelector } from '../../components/managed-selector/ManagedWorkspaceSelector';
import { type TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from '../../components/managed-selector/TreeViewWorkspaceItem';
import { WorkspacesWorkspaceTypes } from '../../../../data/api/workspaces';
import { type WorkspacesWorkspace } from '../../../../data/queries/workspaces';
import { canCreateInType, findDefaultParentWorkspace } from '../../workspaceTypes';
import { WORKSPACE_ACCOUNT, WORKSPACE_PARENT } from '../schema';

export const SetDetails = () => {
  const intl = useIntl();
  const enableBillingFeatures = useFlag('platform.rbac.workspaces-billing-features');
  const enableWorkspaceHierarchy = useWorkspacesFlag('m2'); // M2 or higher
  const enableWorkspaces = useWorkspacesFlag('m5'); // Master flag
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  // React Query hook
  const { data: workspacesData, isLoading } = useWorkspacesQuery();
  const workspaces = workspacesData?.data ?? [];

  const isWorkspaceSelectorEnabled = enableWorkspaceHierarchy || enableWorkspaces;

  const defaultWorkspace = findDefaultParentWorkspace(workspaces);

  // Prefill parent workspace only when the permission-aware selector is NOT active.
  // When ManagedWorkspaceSelector is shown, it handles permission gating on selection;
  // prefilling here would bypass the create-permission check.
  useEffect(() => {
    if (isWorkspaceSelectorEnabled) return;
    if (!values[WORKSPACE_PARENT]) {
      formOptions.change(
        WORKSPACE_PARENT,
        workspaces.find((workspace) => workspace.parent_id === null),
      );
    }
  }, [workspaces.length, isWorkspaceSelectorEnabled]);

  useEffect(() => {
    if (isWorkspaceSelectorEnabled) return;
    if (defaultWorkspace && !values[WORKSPACE_PARENT]) {
      formOptions.change(WORKSPACE_PARENT, defaultWorkspace);
    }
  }, [defaultWorkspace, formOptions.change, values[WORKSPACE_PARENT], isWorkspaceSelectorEnabled]);

  const handleWorkspaceSelection = (selectedWorkspace: TreeViewDataItem) => {
    if (instanceOfTreeViewWorkspaceItem(selectedWorkspace)) {
      // Convert the TreeViewWorkspaceItem to a Workspace object for the form
      const workspaceForForm = {
        id: selectedWorkspace.workspace.id,
        parent_id: selectedWorkspace.workspace.parent_id,
        type: selectedWorkspace.workspace.type,
        name: selectedWorkspace.workspace.name,
        description: selectedWorkspace.workspace.description,
        created: selectedWorkspace.workspace.created,
        updated: selectedWorkspace.workspace.updated,
      };
      formOptions.change(WORKSPACE_PARENT, workspaceForForm);
    }
  };

  const parentFromForm = values[WORKSPACE_PARENT] as WorkspacesWorkspace | undefined;

  // Clear pre-selected parent if user lacks create permission on that type
  // (e.g. root workspace passed via location.state).
  useEffect(() => {
    if (!isWorkspaceSelectorEnabled) return;
    if (parentFromForm?.type && !canCreateInType(parentFromForm.type)) {
      formOptions.change(WORKSPACE_PARENT, undefined);
    }
  }, [parentFromForm?.type, isWorkspaceSelectorEnabled]);

  const parentIsCreatable = !parentFromForm?.type || canCreateInType(parentFromForm.type);
  const initialTreeItem: TreeViewWorkspaceItem | undefined =
    parentFromForm?.id && parentIsCreatable
      ? {
          name: parentFromForm.name ?? '',
          id: parentFromForm.id,
          workspace: {
            id: parentFromForm.id,
            name: parentFromForm.name ?? '',
            description: parentFromForm.description,
            type: (parentFromForm.type as WorkspacesWorkspaceTypes) ?? WorkspacesWorkspaceTypes.Standard,
            parent_id: parentFromForm.parent_id ?? '',
          },
          children: [],
        }
      : undefined;

  const renderWorkspaceSelector = () => {
    if (isWorkspaceSelectorEnabled) {
      return <ManagedWorkspaceSelector onSelect={handleWorkspaceSelection} requiredPermission="create" initialSelectedWorkspace={initialTreeItem} />;
    }

    if (isLoading) {
      return <Skeleton width="100%" height="36px" />;
    }

    return (
      <MenuToggle isFullWidth className="pf-v6-u-max-width-100" isDisabled isExpanded={false}>
        {defaultWorkspace?.name || 'Default Workspace'}
      </MenuToggle>
    );
  };

  return (
    <Grid hasGutter className="pf-v6-u-my-lg">
      <GridItem span={enableBillingFeatures ? 6 : 12}>
        <FormGroup
          label={intl.formatMessage(messages.parentWorkspace)}
          isRequired
          labelHelp={
            <InputHelpPopover
              bodyContent={
                <>
                  <Content component="p">{intl.formatMessage(messages.workspaceParentHelperText)}</Content>
                  <Button className="pf-v6-u-mt-xs" variant="link" href="#" isInline>
                    {intl.formatMessage(messages.learnMore)}
                  </Button>
                </>
              }
              field="parent workspace"
            />
          }
        >
          {renderWorkspaceSelector()}
        </FormGroup>
      </GridItem>
      {enableBillingFeatures && (
        <GridItem span={6}>
          <FormGroup
            label={intl.formatMessage(messages.billingAccount)}
            isRequired
            labelHelp={
              <InputHelpPopover
                bodyContent={
                  <>
                    <Content component="p">{intl.formatMessage(messages.workspaceBillingAccountHelperText)}</Content>
                    <Button className="pf-v6-u-mt-xs" variant="link" href="#" isInline>
                      {intl.formatMessage(messages.learnMore)}
                    </Button>
                  </>
                }
                field="billing features"
              />
            }
          >
            <FormSelect
              value={values[WORKSPACE_ACCOUNT]}
              onChange={(_e: unknown, value: string) => formOptions.change(WORKSPACE_ACCOUNT, value)}
              aria-label="Workspace billing account select"
              ouiaId="SetDetails-billing-account-select"
            >
              <FormSelectOption value="test" label="Billing account 1 (default)" />
            </FormSelect>
          </FormGroup>
        </GridItem>
      )}
    </Grid>
  );
};
