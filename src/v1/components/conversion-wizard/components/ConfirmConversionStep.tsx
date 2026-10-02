import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useIntl } from 'react-intl';

/**
 * Confirm conversion step component
 * Shows a non-dismissable warning banner and confirmation content
 */
export const ConfirmConversionStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage({
          id: 'conversionWizardConfirmConversionTitle',
          defaultMessage: 'Confirm conversion',
          description: 'Confirm conversion step title',
        })}
      </Title>

      {/* Non-dismissable warning banner */}
      <Alert
        variant="warning"
        isInline
        title={intl.formatMessage({
          id: 'conversionWizardConversionPermanentTitle',
          defaultMessage: 'Conversion is permanent',
          description: 'Warning banner title for confirm conversion step',
        })}
        className="pf-v6-u-mt-md"
      >
        {intl.formatMessage({
          id: 'conversionWizardConversionPermanentDesc',
          defaultMessage:
            'Once you convert to workspace-based access management, you cannot revert to the previous experience. All existing permissions will be preserved, but the organizational structure will change.',
          description: 'Warning banner description for confirm conversion step',
        })}
      </Alert>

      {/* Main content */}
      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardConfirmIntro',
          defaultMessage: 'You are about to convert your organization from User Access to workspace-based access management. This action will:',
          description: 'Confirm conversion intro text',
        })}
      </Content>

      <List className="pf-v6-u-mt-sm">
        <ListItem>
          {intl.formatMessage({
            id: 'conversionWizardConfirmAction1',
            defaultMessage: 'Create a workspace hierarchy (root, default, and ungrouped assets workspaces)',
            description: 'Confirm conversion action item 1',
          })}
        </ListItem>
        <ListItem>
          {intl.formatMessage({
            id: 'conversionWizardConfirmAction2',
            defaultMessage: 'Convert all existing permissions to role bindings',
            description: 'Confirm conversion action item 2',
          })}
        </ListItem>
        <ListItem>
          {intl.formatMessage({
            id: 'conversionWizardConfirmAction3',
            defaultMessage: 'Preserve all user groups and role assignments',
            description: 'Confirm conversion action item 3',
          })}
        </ListItem>
        <ListItem>
          {intl.formatMessage({
            id: 'conversionWizardConfirmAction4',
            defaultMessage: 'Change the scope of Default Admin Access and Default Access groups',
            description: 'Confirm conversion action item 4',
          })}
        </ListItem>
      </List>

      <Content component="p" className="pf-v6-u-mt-md pf-v6-u-mb-md">
        {intl.formatMessage({
          id: 'conversionWizardConfirmQuestion',
          defaultMessage: 'Are you sure you wish to move forward with this conversion?',
          description: 'Confirm conversion question',
        })}
      </Content>
    </div>
  );
};
