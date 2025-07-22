import React from 'react';
import { Label, Title } from '@patternfly/react-core';
import { ArrowRightIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface RecommendedContentTableProps {
  className?: string;
}

export const RecommendedContentTable: React.FC<RecommendedContentTableProps> = ({ className }) => {
  const intl = useIntl();

  return (
    <>
      <Title headingLevel="h2" className="pf-v5-u-mb-md" data-ouia-component-id="recommended-title">
        {intl.formatMessage(messages.recommendedContentTitle)}
      </Title>
      <Table aria-label="Recommended content table" className={className} data-ouia-component-id="recommended-table">
        <Tbody>
          <Tr key="row1">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem1)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="https://console.redhat.com/iam/user-access/overview?quickstart=rbac-admin-vuln-permissions"
                title="Link to Quick start - Restricting access to a service to a team"
              >
                {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row2">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem2)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-granular-malware-rhel-access"
                title="Link to Quick start - Configuring granular permissions by service"
              >
                {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row3">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem3)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-read-only-vuln-permissions"
                title="Link to Quick start - Configuring read-only permissions for a team"
              >
                {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row4">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem4)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-reducing-permissions"
                title="Link to Quick start - Reducing permissions across my organization"
              >
                {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row5">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem5)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="orange">{intl.formatMessage(messages.labelDocumentation)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="https://access.redhat.com/documentation/en-us/red_hat_hybrid_cloud_console/2023/html/user_access_configuration_guide_for_role-based_access_control_rbac/index"
                title="Link to User Access Configuration Guide for RBAC"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage(messages.viewDocumentationLink)} <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row6">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem6)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="purple">{intl.formatMessage(messages.labelOtherResource)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a href="https://developers.redhat.com/api-catalog/api/rbac" title="Link to RBAC API" target="_blank" rel="noreferrer">
                {intl.formatMessage(messages.viewApiSiteLink)} <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row7">
            <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem7)}</Td>
            <Td dataLabel="Recommended content category">
              <Label color="purple">{intl.formatMessage(messages.labelOtherResource)}</Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
              <a
                href="https://www.redhat.com/en/blog/role-based-access-control-red-hat-hybrid-cloud-console"
                title="Link to Red Hat blog post on Console RBAC"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage(messages.readBlogPostLink)} <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </>
  );
};
