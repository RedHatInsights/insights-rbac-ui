import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import { useIdentity } from '../../../shared/hooks/useIdentity';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import pathnames from '../../utilities/pathnames';
import messages from '../../../Messages';
import { useIntl } from 'react-intl';
import { useOrgGroups } from '../../data/queries/groupAssignments';
import type { WorkspaceGroupRow } from '../../data/queries/groupAssignments';
import { BaseGroupAssignmentsTable } from '../workspaces/workspace-detail/components';
import { RemoveGroupFromWorkspaceModal } from '../workspaces/workspace-detail/components/RemoveGroupFromWorkspaceModal';

const PLACEHOLDER = '--';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { '*': splat = '' } = useParams<{ '*': string }>();
  const { accountNumber, organizationId, organizationName, isLoading } = useOrganizationData();
  const { orgAdmin } = useIdentity();

  const [groupToRemove, setGroupToRemove] = useState<WorkspaceGroupRow | undefined>();

  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useOrgGroups(organizationId!, {
    enabled: !isLoading && !!organizationId,
  });

  const tenantResourceId = organizationId ? `redhat/${organizationId}` : '';

  const currentWorkspace = useMemo(
    () =>
      organizationId
        ? { id: tenantResourceId, name: organizationName || intl.formatMessage(messages.organizationWideAccessTitle), type: 'tenant' as const }
        : undefined,
    [organizationId, tenantResourceId, organizationName, intl],
  );

  const groupId = useMemo(() => {
    if (!splat || splat === 'grant-access') return undefined;
    const match = splat.match(/^([^/]+)/);
    return match?.[1];
  }, [splat]);

  const handleGrantAccess = useCallback(() => {
    navigate(pathnames['org-management-grant-access'].link());
  }, [navigate]);

  const handleEditAccess = useCallback(
    (group: WorkspaceGroupRow) => {
      navigate(pathnames['org-management-edit-access'].link(group.id));
    },
    [navigate],
  );

  const handleGroupSelect = useCallback(
    (group: { id: string }) => {
      navigate(pathnames['org-management-group'].link(group.id));
    },
    [navigate],
  );

  const handleGroupDeselect = useCallback(() => {
    navigate(pathnames['organization-management'].link());
  }, [navigate]);

  return (
    <>
      <PageHeader
        title={intl.formatMessage(messages.organizationWideAccessTitle)}
        subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
      >
        <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.organizationNameLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading organization name" width="120px" /> : organizationName || PLACEHOLDER}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.accountNumberLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading account number" width="80px" /> : accountNumber || PLACEHOLDER}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.organizationIdLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading organization ID" width="80px" /> : organizationId || PLACEHOLDER}
            </p>
          </FlexItem>
        </Flex>
      </PageHeader>
      <PageSection>
        <BaseGroupAssignmentsTable
          groups={roleBindings}
          isLoading={roleBindingsIsLoading}
          currentWorkspace={currentWorkspace}
          canGrantAccess={orgAdmin}
          canEditAccess={orgAdmin}
          canRevokeAccess={orgAdmin}
          ouiaId="organization-role-assignments-table"
          syncWithUrl={false}
          onGrantAccess={handleGrantAccess}
          onEditAccess={handleEditAccess}
          onRemoveAccess={setGroupToRemove}
          focusedGroupId={groupId}
          onGroupSelect={handleGroupSelect}
          onGroupDeselect={handleGroupDeselect}
        />
        {groupToRemove && currentWorkspace && (
          <RemoveGroupFromWorkspaceModal
            isOpen
            groupId={groupToRemove.id}
            groupName={groupToRemove.name}
            workspaceId={currentWorkspace.id}
            workspaceName={currentWorkspace.name}
            resourceType="tenant"
            onClose={() => setGroupToRemove(undefined)}
          />
        )}
      </PageSection>
      <Outlet />
    </>
  );
};

export default OrganizationManagement;
