import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ButtonVariant } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import { removeRole } from '../../redux/roles/actions';
import { fetchRole } from '../../redux/roles/helper';
import { roleNameSelector } from './roleSelectors';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import type { RBACStore } from '../../redux/store.d';

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
  const roleName = useSelector((state: RBACStore) => {
    if (roles.length === 1) {
      return roleNameSelector(state, roles[0]);
    }

    return roles.length;
  });
  const [internalRoleName, setInternalRoleName] = useState<string | number | undefined>(roleName);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();

  useEffect(() => {
    if (roles && roleName) {
      setInternalRoleName(roleName);
    } else if (roles && roles.length === 1) {
      fetchRole(roles[0])
        .then((role) => setInternalRoleName(role.display_name))
        .catch((error: { errors?: { detail?: string }[] }) =>
          addNotification({ variant: 'danger', title: 'Could not get role', description: error?.errors?.[0]?.detail }),
        );
    }
  }, [roleName, roles.join(',')]);

  const onSubmit = async () => {
    try {
      await Promise.all(roles.map((id) => (dispatch(removeRole(id)) as any).payload));
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeRoleSuccessTitle),
        description: intl.formatMessage(messages.removeRoleSuccessDescription),
      });
      afterSubmit();
    } catch (error) {
      console.error('Failed to remove role:', error);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.removeRoleErrorTitle),
        description: intl.formatMessage(messages.removeRoleErrorDescription),
      });
    }
    navigate(submitRoute);
  };

  const onCancel = () => navigate(cancelRoute, { replace: true });
  if (!internalRoleName) {
    return null;
  }

  return (
    <WarningModal
      withCheckbox
      isOpen={!isLoading}
      aria-label="delete-role"
      title={intl.formatMessage(messages.deleteRoleQuestion)}
      onClose={onCancel}
      onConfirm={onSubmit}
      confirmButtonLabel={intl.formatMessage(messages.deleteRole)}
      confirmButtonVariant={ButtonVariant.danger}
    >
      <Content>
        <Content component={ContentVariants.p}>
          <FormattedMessage
            {...messages.roleWilBeRemovedWithPermissions}
            values={{
              strong: (text: React.ReactNode) => <strong>{text}</strong>,
              name: internalRoleName,
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
