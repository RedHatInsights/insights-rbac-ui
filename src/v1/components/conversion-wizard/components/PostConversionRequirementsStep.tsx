import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useIntl } from 'react-intl';

export const PostConversionRequirementsStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage({
          id: 'conversionWizardPostConversionTitle',
          defaultMessage: 'Post-conversion requirements',
          description: 'Post-conversion requirements step title',
        })}
      </Title>

      <Content component="p" className="pf-v6-u-mt-sm">
        {intl.formatMessage({
          id: 'conversionWizardPostConversionIntro',
          defaultMessage:
            'Review your access structure within one week of conversion. Default Admin Access and Default Access are fixed by design and drive everything below.',
          description: 'Post-conversion requirements introduction paragraph',
        })}
      </Content>

      <List className="pf-v6-u-mt-sm" component="ol">
        <ListItem>
          <strong>
            {intl.formatMessage({
              id: 'conversionWizardDefaultWorkspaceScopeTitle',
              defaultMessage: "Know what's fixed",
              description: 'Know what is fixed title',
            })}
          </strong>
          <Content component="p">
            {intl.formatMessage({
              id: 'conversionWizardDefaultWorkspaceScopeDesc',
              defaultMessage:
                "Default Admin Access binds at the root workspace to every Organization Administrator with every admin role, and cascades everywhere below. Default Access binds at the Default workspace to every user in your organization. Neither group's membership can change; only Default Access's roles can.",
              description: 'Know what is fixed description',
            })}
          </Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>
            {intl.formatMessage({
              id: 'conversionWizardAdjustDefaultAccessTitle',
              defaultMessage: 'Adjust default access roles',
              description: 'Adjust default access roles title',
            })}
          </strong>
          <Content component="p">
            {intl.formatMessage({
              id: 'conversionWizardAdjustDefaultAccessDesc',
              defaultMessage:
                "Default Access carries over whatever roles you had configured before conversion, including any customizations. In Users and Groups, review what's bound at the Default workspace and remove anything granting more access than needed.",
              description: 'Adjust default access roles description',
            })}
          </Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>
            {intl.formatMessage({
              id: 'conversionWizardReviewUngroupedHostsTitle',
              defaultMessage: 'Review the Ungrouped hosts workspace',
              description: 'Review Ungrouped hosts workspace title',
            })}
          </strong>
          <Content component="p">
            {intl.formatMessage({
              id: 'conversionWizardReviewUngroupedHostsDesc',
              defaultMessage: "Systems here inherit Default Access's bound roles. Confirm that access still matches your changes in step 2.",
              description: 'Review Ungrouped hosts workspace description',
            })}
          </Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>
            {intl.formatMessage({
              id: 'conversionWizardVerifyCriticalAccessTitle',
              defaultMessage: 'Verify critical user access',
              description: 'Verify critical user access title',
            })}
          </strong>
          <List>
            <ListItem>
              {intl.formatMessage({
                id: 'conversionWizardVerifyCriticalAccessItem1',
                defaultMessage: 'Confirm 3-5 users across your org can reach their systems',
                description: 'Verify critical user access bullet point 1',
              })}
            </ListItem>
            <ListItem>
              {intl.formatMessage({
                id: 'conversionWizardVerifyCriticalAccessItem2',
                defaultMessage: 'Covers Default Admin Access, Default Access, and custom groups',
                description: 'Verify critical user access bullet point 2',
              })}
            </ListItem>
          </List>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>
            {intl.formatMessage({
              id: 'conversionWizardPlanStructureTitle',
              defaultMessage: 'Plan workspace structure',
              description: 'Plan workspace structure title',
            })}
          </strong>
          <List>
            <ListItem>
              {intl.formatMessage({
                id: 'conversionWizardPlanStructureIntro',
                defaultMessage: 'Create subworkspaces under the Default workspace for:',
                description: 'Plan workspace structure introduction',
              })}
              <List>
                <ListItem>
                  {intl.formatMessage({
                    id: 'conversionWizardPlanStructureItem1',
                    defaultMessage: 'High-security production environments',
                    description: 'Plan workspace structure bullet point 1',
                  })}
                </ListItem>
                <ListItem>
                  {intl.formatMessage({
                    id: 'conversionWizardPlanStructureItem2',
                    defaultMessage: 'Compliance-required isolated systems',
                    description: 'Plan workspace structure bullet point 2',
                  })}
                </ListItem>
              </List>
            </ListItem>
            <ListItem>
              {intl.formatMessage({
                id: 'conversionWizardPlanStructureClosing',
                defaultMessage:
                  'Organization Administrators keep access everywhere via Default Admin Access, so subworkspaces isolate other users, not admins.',
                description: 'Plan workspace structure closing statement',
              })}
            </ListItem>
          </List>
        </ListItem>
      </List>
    </div>
  );
};
