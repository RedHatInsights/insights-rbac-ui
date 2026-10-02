import React from 'react';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { useIntl } from 'react-intl';

interface RecommendedContentTableProps {
  className?: string;
}

export const RecommendedContentTable: React.FC<RecommendedContentTableProps> = ({ className }) => {
  const intl = useIntl();

  return (
    <>
      <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="recommended-title">
        {intl.formatMessage({
          id: 'recommendedContentTitle',
          defaultMessage: 'Recommended content',
          description: 'Recommended content section title',
        })}
      </Title>
      <Table aria-label="Recommended content table" className={className} data-ouia-component-id="recommended-table">
        <Tbody>
          <Tr key="row1">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem1',
                defaultMessage: 'Restricting access to a service to a team',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">
                {intl.formatMessage({ id: 'labelQuickStart', defaultMessage: 'Quick start', description: 'Quick Start label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="https://console.redhat.com/iam/user-access/overview?quickstart=rbac-admin-vuln-permissions"
                title="Link to Quick start - Restricting access to a service to a team"
              >
                {intl.formatMessage({ id: 'beginQuickStartLink', defaultMessage: 'Begin Quick start', description: 'Begin Quick start link' })}{' '}
                <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row2">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem2',
                defaultMessage: 'Configuring granular permissions by service',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">
                {intl.formatMessage({ id: 'labelQuickStart', defaultMessage: 'Quick start', description: 'Quick Start label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-granular-malware-rhel-access"
                title="Link to Quick start - Configuring granular permissions by service"
              >
                {intl.formatMessage({ id: 'beginQuickStartLink', defaultMessage: 'Begin Quick start', description: 'Begin Quick start link' })}{' '}
                <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row3">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem3',
                defaultMessage: 'Configuring read-only permissions for a team',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">
                {intl.formatMessage({ id: 'labelQuickStart', defaultMessage: 'Quick start', description: 'Quick Start label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-read-only-vuln-permissions"
                title="Link to Quick start - Configuring read-only permissions for a team"
              >
                {intl.formatMessage({ id: 'beginQuickStartLink', defaultMessage: 'Begin Quick start', description: 'Begin Quick start link' })}{' '}
                <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row4">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem4',
                defaultMessage: 'Reducing permissions across my organization',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="green">
                {intl.formatMessage({ id: 'labelQuickStart', defaultMessage: 'Quick start', description: 'Quick Start label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-reducing-permissions"
                title="Link to Quick start - Reducing permissions across my organization"
              >
                {intl.formatMessage({ id: 'beginQuickStartLink', defaultMessage: 'Begin Quick start', description: 'Begin Quick start link' })}{' '}
                <ArrowRightIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row5">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem5',
                defaultMessage: 'User Access Configuration Guide for RBAC',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="orange">
                {intl.formatMessage({ id: 'labelDocumentation', defaultMessage: 'Documentation', description: 'Documentation label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/administer-manage_user_permissions_rbac_models"
                title="Link to User Access Configuration Guide for RBAC"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage({ id: 'viewDocumentationLink', defaultMessage: 'View documentation', description: 'View Documentation link' })}{' '}
                <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row6">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({ id: 'recommendedContentItem6', defaultMessage: 'RBAC API v.1.0.0', description: 'Recommended content' })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="purple">
                {intl.formatMessage({ id: 'labelOtherResource', defaultMessage: 'Other resource', description: 'Other resource label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a href="https://developers.redhat.com/api-catalog/api/rbac" title="Link to RBAC API" target="_blank" rel="noreferrer">
                {intl.formatMessage({ id: 'viewApiSiteLink', defaultMessage: 'View API site', description: 'View API site link' })}{' '}
                <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
          <Tr key="row7">
            <Td dataLabel="Recommended content label">
              {intl.formatMessage({
                id: 'recommendedContentItem7',
                defaultMessage: 'Red Hat blog post on Console RBAC',
                description: 'Recommended content',
              })}
            </Td>
            <Td dataLabel="Recommended content category">
              <Label color="purple">
                {intl.formatMessage({ id: 'labelOtherResource', defaultMessage: 'Other resource', description: 'Other resource label' })}
              </Label>
            </Td>
            <Td dataLabel="Recommended content link" className="pf-v6-u-text-align-right">
              <a
                href="https://www.redhat.com/en/blog/role-based-access-control-red-hat-hybrid-cloud-console"
                title="Link to Red Hat blog post on Console RBAC"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage({ id: 'readBlogPostLink', defaultMessage: 'Read blog post', description: 'Read blog post link' })}{' '}
                <ExternalLinkAltIcon />
              </a>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </>
  );
};
