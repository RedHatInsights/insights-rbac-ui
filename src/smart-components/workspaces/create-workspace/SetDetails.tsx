import React from 'react';
import { FormGroup, FormSelect, FormSelectOption, Grid, GridItem } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WORKSPACE_ACCOUNT, WORKSPACE_PARENT } from './schema';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const SetDetails = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  return (
    <Grid hasGutter className="pf-v5-u-my-lg">
      <GridItem span={6}>
        <FormGroup label={intl.formatMessage(messages.parentWorkspace)} isRequired>
          <FormSelect
            value={values[WORKSPACE_PARENT]}
            onChange={(_e: unknown, value: string) => formOptions.change(WORKSPACE_PARENT, value)}
            aria-label="Workspace parent select"
            ouiaId="SetDetails-parent-select"
          >
            <FormSelectOption value="test" label="Medical Imaging IT" />
          </FormSelect>
        </FormGroup>
      </GridItem>
      <GridItem span={6}>
        <FormGroup label={intl.formatMessage(messages.billingAccount)} isRequired>
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
    </Grid>
  );
};

export default SetDetails;
