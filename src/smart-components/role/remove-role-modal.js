import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ButtonVariant, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import { removeRole } from '../../redux/actions/role-actions';
import { fetchRole } from '../../helpers/role/role-helper';
import { roleNameSelector } from './role-selectors';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';

const RemoveRoleModal = ({ cancelRoute, submitRoute = cancelRoute, afterSubmit, isLoading }) => {
  const intl = useIntl();
  const { roleId } = useParams();
  const roles = roleId.split(',');
  const roleName = useSelector((state) => {
    if (roles.length === 1) {
      return roleNameSelector(state, roles[0]);
    }

    return roles.length;
  });
  const [internalRoleName, setInternalRoleName] = useState(roleName);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  useEffect(() => {
    if (roles && roleName) {
      setInternalRoleName(roleName);
    } else if (roles && roles.length === 1) {
      fetchRole(roles[0])
        .then((role) => setInternalRoleName(role.display_name))
        .catch((error) => dispatch(addNotification({ variant: 'danger', title: 'Could not get role', description: error?.errors?.[0]?.detail })));
    }
  }, [roleName, roles]);

  const onSubmit = () => {
    Promise.all(roles.map((id) => dispatch(removeRole(id)))).then(() => afterSubmit());
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
      <TextContent>
        <Text component={TextVariants.p}>
          <FormattedMessage
            {...messages.roleWilBeRemovedWithPermissions}
            values={{
              strong: (text) => <strong>{text}</strong>,
              name: internalRoleName,
              count: roles.length,
            }}
          />
        </Text>
      </TextContent>
    </WarningModal>
  );
};

RemoveRoleModal.propTypes = {
  cancelRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]).isRequired,
  submitRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  afterSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default RemoveRoleModal;
