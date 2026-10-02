import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { DescriptionList } from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { DescriptionListDescription } from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { DescriptionListGroup } from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { DescriptionListTerm } from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import { useWorkspacesBillingFeatures } from '../../../../../capabilities/useWorkspacesFlag';
import { BUNDLES, WORKSPACE_ACCOUNT, WORKSPACE_DESCRIPTION, WORKSPACE_FEATURES, WORKSPACE_NAME, WORKSPACE_PARENT } from '../schema';

export const ReviewStep = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const enableBillingFeatures = useWorkspacesBillingFeatures();

  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-lg">
        {intl.formatMessage({ id: 'reviewNewWorkspace', defaultMessage: 'Review new workspace', description: 'Review new workspace label' })}
      </Title>
      <Content component="p" className="pf-v6-u-mb-xl">
        {intl.formatMessage({
          id: 'reviewWorkspaceDescription',
          defaultMessage: 'Review the information below to make sure everything is correct before creating a new workspace.',
          description: 'Review workspace description',
        })}
      </Content>
      <DescriptionList isHorizontal termWidth="25%">
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'workspaceName', defaultMessage: 'Workspace name', description: 'Workspace name label' })}
          </DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_NAME]}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'parentWorkspace', defaultMessage: 'Parent workspace', description: 'Parent workspace label' })}
          </DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_PARENT]?.name ?? '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'workspaceDetails', defaultMessage: 'Workspace details', description: 'Workspace details label' })}
          </DescriptionListTerm>
          <DescriptionListDescription>{values[WORKSPACE_DESCRIPTION] ?? '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        {enableBillingFeatures && (
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {intl.formatMessage({ id: 'billingAccount', defaultMessage: 'Billing account', description: 'Billing account label' })}
              </DescriptionListTerm>
              <DescriptionListDescription>{values[WORKSPACE_ACCOUNT]}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {intl.formatMessage({ id: 'availableFeatures', defaultMessage: 'Available feature(s)', description: 'Available features label' })}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {values[WORKSPACE_FEATURES]?.length > 0 ? (
                  values[WORKSPACE_FEATURES].map((item: string) => (
                    <Content component="p" key={item}>
                      {BUNDLES.find((bundle) => bundle.value === item)?.label}
                    </Content>
                  ))
                ) : (
                  <Content component="p">-</Content>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </>
        )}
        {values[WORKSPACE_FEATURES]?.length > 0 ? (
          <DescriptionListGroup>
            <DescriptionListTerm>
              {intl.formatMessage({ id: 'earMarkOfFeatures', defaultMessage: 'Ear mark of feature(s)', description: 'Ear mark of features label' })}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {values[WORKSPACE_FEATURES].map((item: string) => {
                const bundle = BUNDLES.find((bundle) => bundle.value === item);
                return <Content component="p" key={item}>{`${bundle?.label}: ${values[`ear-mark-${bundle?.value}-cores`] ?? 0} Cores`}</Content>;
              })}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
      </DescriptionList>
    </div>
  );
};
