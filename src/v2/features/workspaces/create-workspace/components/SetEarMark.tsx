import React from 'react';
import { useIntl } from 'react-intl';
import { NumberInput } from '@patternfly/react-core/dist/dynamic/components/NumberInput';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WORKSPACE_ACCOUNT } from '../schema';

export const SetEarMark = ({ feature, ...props }: UseFieldApiConfig) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-sm">
          {intl.formatMessage(
            { id: 'setEarmark', defaultMessage: 'Set ear mark for {bundle} features', description: 'Set ear mark step label' },
            { bundle: feature.label },
          )}
        </Title>
        <Content className="pf-v6-u-mb-md">
          <Content component="p">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Content>
        </Content>
        <Content className="pf-v6-u-mb-md">
          <Content component="p">
            {intl.formatMessage(
              {
                id: 'totalAccountAvailability',
                defaultMessage: 'Total availability from {billingAccount}: {count} Cores',
                description: 'Total account availability text',
              },
              {
                billingAccount: formOptions.getState().values[WORKSPACE_ACCOUNT] ?? 'XXX',
                count: input.value || 0,
              },
            )}
          </Content>
        </Content>
      </StackItem>
      <StackItem>
        <NumberInput className="pf-v6-u-mr-sm" /> <b>{intl.formatMessage({ id: 'cores', defaultMessage: 'Cores', description: 'Cores label' })}</b>
      </StackItem>
    </Stack>
  );
};
