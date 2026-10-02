import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormSelect } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { FormSelectOption } from '@patternfly/react-core/dist/dynamic/components/FormSelect';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React from 'react';
import { useIntl } from 'react-intl';

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
      label={intl.formatMessage({ id: 'billingAccount', defaultMessage: 'Billing account', description: 'Billing account label' })}
      isRequired
      labelHelp={
        <InputHelpPopover
          bodyContent={
            <>
              <Content component="p">
                {intl.formatMessage({
                  id: 'workspaceBillingAccountHelperText',
                  defaultMessage:
                    "The default billing account is based on the parent workspace's billing account. You can switch to a different billing account as needed. This change is independent of the workspace hierarchy.",
                  description: 'Workspace billing account field helper text',
                })}
              </Content>
              <Button className="pf-v6-u-mt-xs" variant="link" href="#" isInline>
                {intl.formatMessage({ id: 'learnMore', defaultMessage: 'Learn more', description: 'learn more link' })}
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
