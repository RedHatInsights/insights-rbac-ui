import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useFlag } from '@unleash/proxy-client-react';
import {
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Skeleton,
  Text,
} from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WORKSPACE_ACCOUNT, WORKSPACE_PARENT } from './schema';
import { RBACStore } from '../../../redux/store';
import { fetchWorkspaces } from '../../../redux/actions/workspaces-actions';
import messages from '../../../Messages';
import InputHelpPopover from '../../../presentational-components/InputHelpPopover';

const SetDetails = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const enableBillingFeatures = useFlag('platform.rbac.workspaces-billing-features');
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, workspaces } = useSelector((state: RBACStore) => state.workspacesReducer);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    !values[WORKSPACE_PARENT] &&
      formOptions.change(
        WORKSPACE_PARENT,
        workspaces.find((workspace) => workspace.parent_id === null)
      );
  }, [workspaces.length]);

  const defaultWorkspace = workspaces.find((workspace) => workspace.name === 'Default Workspace');
  formOptions.change(WORKSPACE_PARENT, defaultWorkspace);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle isFullWidth style={{ maxWidth: '100%' }} isDisabled ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen}>
      {defaultWorkspace?.name}
    </MenuToggle>
  );

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
          {isLoading ? (
            <Skeleton width="100%" height="36px" />
          ) : (
            <Select
              ouiaId="SetDetails-parent-select"
              isOpen={isOpen}
              selected={defaultWorkspace?.id}
              onSelect={(_e, value) => {
                value && formOptions.change(WORKSPACE_PARENT, defaultWorkspace);
                setIsOpen(false);
              }}
              onOpenChange={(isOpen) => setIsOpen(isOpen)}
              toggle={toggle}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                <SelectOption key={`${defaultWorkspace?.name}-${defaultWorkspace?.id}`} isSelected value={defaultWorkspace?.id}>
                  {defaultWorkspace?.name}
                </SelectOption>
              </SelectList>
            </Select>
          )}
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
