import React from 'react';
import PropTypes from 'prop-types';
import { Title, Button, EmptyState, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { useDispatch } from 'react-redux';
import AppLink from '../../../presentational-components/shared/AppLink';
import { fetchRole } from '../../../redux/actions/role-actions';
import { useIntl } from 'react-intl';
import AppLink from '../../../presentational-components/shared/AppLink';
import { fetchRole } from '../../../redux/actions/role-actions.js';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

const AddRolePermissionSuccess = ({ currentRoleID }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  return (
    <>
      <EmptyState>
        <EmptyStateIcon color="green" icon={CheckCircleIcon} />
        <Title headingLevel="h4" size="lg">
          {intl.formatMessage(messages.permissionsAddedSuccessfully)}
        </Title>
        <EmptyStateBody />
        <AppLink to={pathnames['role-detail'].link.replace(':roleId', currentRoleID)}>
          <Button onClick={() => dispatch(fetchRole(currentRoleID))}>{intl.formatMessage(messages.exit)}</Button>
        </AppLink>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;

AddRolePermissionSuccess.propTypes = {
  currentRoleID: PropTypes.string.isRequired,
};
