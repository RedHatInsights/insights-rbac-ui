import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { ServiceAccount } from '../../../../../redux/service-accounts/types';
import messages from '../../../../../Messages';
import { AppLink } from '../../../../../components/navigation/AppLink';
import ServiceAccountsList from './ServiceAccountsList';

interface SetServiceAccountProps {
  name: string;
}

const SetServiceAccounts: React.FunctionComponent<SetServiceAccountProps> = ({ name }) => {
  const { input } = useFieldApi({ name });
  const intl = useIntl();
  const formOptions = useFormApi();
  const [selectedAccounts, setSelectedAccounts] = useState<ServiceAccount[]>(formOptions.getState().values['service-accounts-list'] || []);

  useEffect(() => {
    input.onChange(selectedAccounts);
    formOptions.change('service-accounts-list', selectedAccounts);
  }, [selectedAccounts]); // Remove unstable formOptions and input dependencies

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
              <ServiceAccountsList initialSelectedServiceAccounts={selectedAccounts} onSelect={setSelectedAccounts} />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

export default SetServiceAccounts;
