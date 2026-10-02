import React from 'react';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';

import { useDeleteRoleMutation, useRoleQuery } from '../../data/queries/roles';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';

type RouteLocation =
  | string
  | {
      pathname: string;
      search?: string;
      hash?: string;
    };

interface RemoveRoleModalProps {
  cancelRoute: RouteLocation;
  submitRoute?: RouteLocation;
  afterSubmit: () => void;
  isLoading: boolean;
}

const RemoveRoleModal: React.FC<RemoveRoleModalProps> = ({ cancelRoute, submitRoute = cancelRoute, afterSubmit, isLoading }) => {
  const intl = useIntl();
  const { roleId } = useParams<{ roleId: string }>();
  const roles = roleId?.split(',') || [];
  const navigate = useAppNavigate();
  const deleteRoleMutation = useDeleteRoleMutation();

  // Fetch role data for single role deletion (to display the name)
  const singleRoleId = roles.length === 1 ? roles[0] : '';
  const { data: roleData } = useRoleQuery(singleRoleId);

  // Role name: either the fetched role's display_name or the count for bulk delete
  const roleName = roles.length === 1 ? roleData?.display_name : roles.length;

  const onSubmit = async () => {
    try {
      // Delete all roles (supports bulk deletion)
      await Promise.all(roles.map((id) => deleteRoleMutation.mutateAsync(id)));
      afterSubmit();
    } catch (error) {
      console.error('Failed to remove role:', error);
      // Error notification is handled by useDeleteRoleMutation
    }
    navigate(submitRoute);
  };

  const onCancel = () => navigate(cancelRoute, { replace: true });

  // Don't render until we have the role name (for single role) or immediately for bulk delete
  if (roles.length === 1 && !roleName) {
    return null;
  }

  return (
    <WarningModal
      withCheckbox
      isOpen={!isLoading}
      aria-label="delete-role"
      title={intl.formatMessage({ id: 'deleteRoleQuestion', defaultMessage: 'Delete role?', description: 'Delete role question message' })}
      onClose={onCancel}
      onConfirm={onSubmit}
      confirmButtonLabel={intl.formatMessage({ id: 'deleteRole', defaultMessage: 'Delete role', description: 'Delete role message' })}
      confirmButtonVariant={ButtonVariant.danger}
    >
      <Content>
        <Content component={ContentVariants.p}>
          <FormattedMessage
            id={'roleWilBeRemovedWithPermissions'}
            defaultMessage={
              "{count, plural, one {The} other {These}} <strong>{name}</strong> {count, plural, one {role} other {roles}} will be removed from any group it's in, and members in the groups will no longer be granted the permissions in the role."
            }
            description={'Role will be removed with permissions message'}
            values={{
              strong: (text: React.ReactNode) => <strong>{text}</strong>,
              name: roleName,
              count: roles.length,
            }}
          />
        </Content>
      </Content>
    </WarningModal>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { RemoveRoleModal };
export default RemoveRoleModal;
