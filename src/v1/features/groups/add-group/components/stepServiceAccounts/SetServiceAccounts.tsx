import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { ExternalLink } from '../../../../../../shared/components/navigation/ExternalLink';
import ServiceAccountsList, { type ServiceAccount } from './ServiceAccountsList';

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
            <Content>
              {intl.formatMessage({
                id: 'addServiceAccountsToGroupDescription',
                defaultMessage:
                  'This list contains all service accounts associated with your Red Hat organization account. Select any service accounts you wish to associate with the User Access group.',
                description: 'Add service accounts to group description',
              })}
              <Alert
                className="pf-v6-u-mt-sm rbac-service-accounts-alert"
                variant="info"
                component="span"
                isInline
                isPlain
                title={intl.formatMessage(
                  {
                    id: 'visitServiceAccountsPage',
                    defaultMessage: 'To add, reset credentials, or delete service accounts visit the {link}.',
                    description: 'Visit service accounts page text',
                  },
                  {
                    link: (
                      <ExternalLink to="/service-accounts">
                        {intl.formatMessage({
                          id: 'serviceAccountsPage',
                          defaultMessage: 'Service Accounts admin page',
                          description: 'Service accounts page message',
                        })}
                      </ExternalLink>
                    ),
                  },
                )}
              />
            </Content>
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
