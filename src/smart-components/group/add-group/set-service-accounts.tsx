import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Alert, Form, FormGroup, Stack, StackItem, TextContent } from '@patternfly/react-core';
import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { ServiceAccount } from '../../../helpers/service-account/types';
import messages from '../../../Messages';
import AppLink from '../../../presentational-components/shared/AppLink';
import ServiceAccountsList from './service-accounts-list';

interface SetServiceAccountProps {
  name: string;
}

const SetServiceAccounts: React.FunctionComponent<SetServiceAccountProps> = ({ name }) => {
  const [selectedAccounts, setSelectedAccounts] = useState<ServiceAccount[]>([]);

  const { input } = useFieldApi({ name });
  const intl = useIntl();
  const formOptions = useFormApi();

  useEffect(() => {
    setSelectedAccounts(formOptions.getState().values['service-accounts-list'] || []);
  }, []);

  useEffect(() => {
    input.onChange(selectedAccounts);
    formOptions.change('service-accounts-list', selectedAccounts);
  }, [selectedAccounts]);

  return (
    <Fragment>
      <Form>
        <Stack hasGutter>
          <StackItem>
            <TextContent>
              {intl.formatMessage(messages.addServiceAccountsToGroupDescription)}
              <Alert
                className="pf-v5-u-mt-sm rbac-service-accounts-alert"
                variant="info"
                component="span"
                isInline
                isPlain
                title={intl.formatMessage(messages.visitServiceAccountsPage, {
                  link: (
                    <AppLink to="/service-accounts" linkBasename="/iam">
                      {intl.formatMessage(messages.serviceAccountsPage)}
                    </AppLink>
                  ),
                })}
              />
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="select-service-accounts">
              <ServiceAccountsList selected={selectedAccounts} setSelected={setSelectedAccounts} />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

export default SetServiceAccounts;
