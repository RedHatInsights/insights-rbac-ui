import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

/**
 * Confirm conversion step component
 * Shows a non-dismissable warning banner and confirmation content
 */
export const ConfirmConversionStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardConfirmConversionTitle)}
      </Title>

      {/* Non-dismissable warning banner */}
      <Alert variant="warning" isInline title={intl.formatMessage(messages.conversionWizardConversionPermanentTitle)} className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardConversionPermanentDesc)}
      </Alert>

      {/* Main content */}
      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardConfirmIntro)}
      </Content>

      <List className="pf-v6-u-mt-sm">
        <ListItem>{intl.formatMessage(messages.conversionWizardConfirmAction1)}</ListItem>
        <ListItem>{intl.formatMessage(messages.conversionWizardConfirmAction2)}</ListItem>
        <ListItem>{intl.formatMessage(messages.conversionWizardConfirmAction3)}</ListItem>
        <ListItem>{intl.formatMessage(messages.conversionWizardConfirmAction4)}</ListItem>
      </List>

      <Content component="p" className="pf-v6-u-mt-md pf-v6-u-mb-md">
        {intl.formatMessage(messages.conversionWizardConfirmQuestion)}
      </Content>
    </div>
  );
};
