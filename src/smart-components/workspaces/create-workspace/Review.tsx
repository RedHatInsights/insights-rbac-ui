import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Title, DescriptionListGroup, DescriptionList, DescriptionListTerm, DescriptionListDescription, Text } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import { BUNDLES, WORKSPACE_ACCOUNT, WORKSPACE_DESCRIPTION, WORKSPACE_FEATURES, WORKSPACE_NAME, WORKSPACE_PARENT } from './schema';
import messages from '../../../Messages';

const ReviewStep = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-lg">
        {intl.formatMessage(messages.reviewNewWorkspace)}
      </Title>
      <DescriptionList isHorizontal termWidth="25%">
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.workspaceName)}</DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_NAME]}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.parentWorkspace)}</DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_PARENT].name}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.workspaceDetails)}</DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_DESCRIPTION] ?? '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.billingAccount)}</DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_ACCOUNT]}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.availableFeatures)}</DescriptionListTerm>
          <DescriptionListDescription>
            {values[WORKSPACE_FEATURES]?.length > 0 ? (
              values[WORKSPACE_FEATURES].map((item: string) => <Text key={item}>{BUNDLES.find((bundle) => bundle.value === item)?.label}</Text>)
            ) : (
              <Text>-</Text>
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {values[WORKSPACE_FEATURES]?.length > 0 ? (
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.earMarkOfFeatures)}</DescriptionListTerm>
            <DescriptionListDescription>
              {values[WORKSPACE_FEATURES].map((item: string) => {
                const bundle = BUNDLES.find((bundle) => bundle.value === item);
                return <Text key={item}>{`${bundle?.label}: ${values[`ear-mark-${bundle?.value}-cores`] ?? 0} Cores`}</Text>;
              })}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
      </DescriptionList>
    </div>
  );
};

export default ReviewStep;
