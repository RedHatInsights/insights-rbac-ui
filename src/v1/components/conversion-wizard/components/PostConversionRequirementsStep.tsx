import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

export const PostConversionRequirementsStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardPostConversionTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-sm">
        {intl.formatMessage(messages.conversionWizardPostConversionIntro)}
      </Content>

      <List className="pf-v6-u-mt-sm" component="ol">
        <ListItem>
          <strong>{intl.formatMessage(messages.conversionWizardDefaultWorkspaceScopeTitle)}</strong>
          <Content component="p">{intl.formatMessage(messages.conversionWizardDefaultWorkspaceScopeDesc)}</Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>{intl.formatMessage(messages.conversionWizardReviewUngroupedHostsTitle)}</strong>
          <Content component="p">{intl.formatMessage(messages.conversionWizardReviewUngroupedHostsDesc)}</Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>{intl.formatMessage(messages.conversionWizardVerifyCriticalAccessTitle)}</strong>
          <List>
            <ListItem>{intl.formatMessage(messages.conversionWizardVerifyCriticalAccessItem1)}</ListItem>
            <ListItem>{intl.formatMessage(messages.conversionWizardVerifyCriticalAccessItem2)}</ListItem>
          </List>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>{intl.formatMessage(messages.conversionWizardReviewRootPermissionsTitle)}</strong>
          <Content component="p">{intl.formatMessage(messages.conversionWizardReviewRootPermissionsDesc)}</Content>
        </ListItem>

        <ListItem className="pf-v6-u-mt-sm">
          <strong>{intl.formatMessage(messages.conversionWizardPlanStructureTitle)}</strong>
          <List>
            <ListItem>
              {intl.formatMessage(messages.conversionWizardPlanStructureIntro)}
              <List>
                <ListItem>{intl.formatMessage(messages.conversionWizardPlanStructureItem1)}</ListItem>
                <ListItem>{intl.formatMessage(messages.conversionWizardPlanStructureItem2)}</ListItem>
                <ListItem>{intl.formatMessage(messages.conversionWizardPlanStructureItem3)}</ListItem>
              </List>
            </ListItem>
            <ListItem>{intl.formatMessage(messages.conversionWizardPlanStructureClosing)}</ListItem>
          </List>
        </ListItem>
      </List>
    </div>
  );
};
