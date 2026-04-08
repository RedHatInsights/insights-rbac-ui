import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import pathnames from '../../utilities/pathnames';
import messages from '../../../Messages';
import { useGroupQuery } from '../../data/queries/groups';
import { useRoleBindingsQuery, useUpdateGroupRolesMutation } from '../../data/queries/workspaces';
import { useAllRolesV2Query } from '../../data/queries/roles';
import { RoleAccessModalContent } from '../workspaces/workspace-detail/components/RoleAccessModal';
import { getModalContainer } from '../../../shared/helpers/modal-container';

/**
 * Route wrapper for the organization-wide Edit Access modal.
 * Rendered at path `org-management-edit-access` inside the org-management route.
 *
 * Mirrors RoleAccessModal but uses `resourceType: 'tenant'` and resolves the
 * tenant resource ID from organization data rather than URL params.
 */
export const RoutedOrgRoleAccessModal: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { organizationId, organizationName, isLoading: orgLoading } = useOrganizationData();

  const tenantResourceId = organizationId ? `redhat/${organizationId}` : '';

  const handleClose = useCallback(() => {
    if (groupId) {
      navigate(pathnames['org-management-group'].link(groupId));
    } else {
      navigate(pathnames['organization-management'].link());
    }
  }, [navigate, groupId]);

  const { data: group, isLoading: groupLoading } = useGroupQuery(groupId ?? '', {
    enabled: !!groupId,
  });

  const { data: allRoles, isLoading: rolesLoading } = useAllRolesV2Query({
    resourceType: 'tenant',
    resourceId: tenantResourceId || undefined,
    enabled: !!tenantResourceId,
  });

  const { data: bindingsData, isLoading: bindingsLoading } = useRoleBindingsQuery(
    {
      limit: 1000,
      subjectType: 'group',
      subjectId: groupId ?? '',
      resourceType: 'tenant',
      resourceId: tenantResourceId,
    },
    { enabled: !!groupId && !!tenantResourceId },
  );

  const updateMutation = useUpdateGroupRolesMutation();

  const handleUpdate = useCallback(
    (selectedRoleIds: string[]) => {
      if (!tenantResourceId || !groupId) return;
      updateMutation.mutate(
        {
          resourceId: tenantResourceId,
          resourceType: 'tenant',
          subjectId: groupId,
          subjectType: 'group',
          roleIds: selectedRoleIds,
        },
        { onSuccess: handleClose },
      );
    },
    [updateMutation, tenantResourceId, groupId, handleClose],
  );

  const assignedRoleIds = useMemo(() => {
    if (!bindingsData?.data) return [];
    return bindingsData.data.flatMap((binding) => binding.roles?.map((r) => r.id).filter((id): id is string => !!id) ?? []);
  }, [bindingsData?.data]);

  if (!groupId) {
    return null;
  }

  const isLoading = orgLoading || groupLoading || rolesLoading || bindingsLoading;
  const workspaceName = organizationName || intl.formatMessage(messages.organizationWideAccessTitle);
  const dataReady = !isLoading && !!group && !!allRoles;

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen
      onClose={handleClose}
      appendTo={getModalContainer()}
      ouiaId="org-role-access-modal"
      aria-labelledby="org-role-access-modal-title"
      aria-describedby="org-role-access-modal-body"
    >
      <ModalHeader title={dataReady ? intl.formatMessage(messages.editAccess) : ''} labelId="org-role-access-modal-title" />
      <ModalBody id="org-role-access-modal-body">
        {isLoading && (
          <div className="pf-v6-u-text-align-center pf-v6-u-py-2xl">
            <Spinner size="xl" aria-label="Loading role access data" />
          </div>
        )}
        {!isLoading && !dataReady && (
          <div className="pf-v6-u-text-align-center pf-v6-u-py-2xl pf-v6-u-color-200">{intl.formatMessage(messages.unableToLoadRoles)}</div>
        )}
        {dataReady && (
          <RoleAccessModalContent
            allRoles={allRoles}
            assignedRoleIds={assignedRoleIds}
            group={{ uuid: group.uuid ?? groupId, name: group.name ?? '' }}
            workspaceName={workspaceName}
            onUpdate={handleUpdate}
            onClose={handleClose}
            isUpdating={updateMutation.isPending}
          />
        )}
      </ModalBody>
    </Modal>
  );
};

export default RoutedOrgRoleAccessModal;
