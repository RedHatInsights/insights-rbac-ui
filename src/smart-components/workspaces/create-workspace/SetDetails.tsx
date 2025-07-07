import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useFlag } from '@unleash/proxy-client-react';
import { Button, FormGroup, FormSelect, FormSelectOption, Grid, GridItem, MenuToggle, Skeleton, Text } from '@patternfly/react-core';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WORKSPACE_ACCOUNT, WORKSPACE_PARENT } from './schema';
import { RBACStore } from '../../../redux/store';
import { fetchWorkspaces } from '../../../redux/actions/workspaces-actions';
import messages from '../../../Messages';
import InputHelpPopover from '../../../presentational-components/InputHelpPopover';
import ManagedSelector from '../managed-selector/ManagedSelector';
import { instanceOfTreeViewWorkspaceItem } from '../managed-selector/TreeViewWorkspaceItem';

const SetDetails = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const enableBillingFeatures = useFlag('platform.rbac.workspaces-billing-features');
  const enableWorkspaceHierarchy = useFlag('platform.rbac.workspace-hierarchy');
  const enableWorkspaces = useFlag('platform.rbac.workspaces');
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const { isLoading, workspaces } = useSelector((state: RBACStore) => state.workspacesReducer);

  const isWorkspaceSelectorEnabled = enableWorkspaceHierarchy && enableWorkspaces;

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    !values[WORKSPACE_PARENT] &&
      formOptions.change(
        WORKSPACE_PARENT,
        workspaces.find((workspace) => workspace.parent_id === null),
      );
  }, [workspaces.length]);

  const defaultWorkspace = workspaces.find((workspace) => workspace.type === 'default');

  useEffect(() => {
    if (defaultWorkspace && !values[WORKSPACE_PARENT]) {
      formOptions.change(WORKSPACE_PARENT, defaultWorkspace);
    }
  }, [defaultWorkspace, formOptions.change, values[WORKSPACE_PARENT]]);

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

  const renderWorkspaceSelector = () => {
    if (isWorkspaceSelectorEnabled) {
      return <ManagedSelector onSelect={handleWorkspaceSelection} />;
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
    <Grid hasGutter className="pf-v5-u-my-lg">
      <GridItem span={enableBillingFeatures ? 6 : 12}>
        <FormGroup
          label={intl.formatMessage(messages.parentWorkspace)}
          isRequired
          labelIcon={
            <InputHelpPopover
              bodyContent={
                <>
                  <Text>{intl.formatMessage(messages.workspaceParentHelperText)}</Text>
                  <Button className="pf-v5-u-mt-xs" variant="link" href="#" isInline>
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
            labelIcon={
              <InputHelpPopover
                bodyContent={
                  <>
                    <Text>{intl.formatMessage(messages.workspaceBillingAccountHelperText)}</Text>
                    <Button className="pf-v5-u-mt-xs" variant="link" href="#" isInline>
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

export default SetDetails;
