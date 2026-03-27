import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormSelect } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { FormSelectOption } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import InputHelpPopover from '../../../../../shared/components/forms/InputHelpPopover';
import { WORKSPACE_ACCOUNT } from '../schema';

/**
 * Billing account selector — placeholder UI behind `platform.rbac.workspaces-billing-features`.
 *
 * Currently renders a single hardcoded option. Real implementation depends on
 * Kessel integration for per-workspace billing account selection, tracked in:
 * - CRCPLAN-274: Cross-Org Sharing (Workspaces and Billing Accounts)
 * - CRCPLAN-367: Kessel dependency for billing account widget
 */
export const SetDetails = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  return (
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
  );
};
