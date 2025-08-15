import React from 'react';
import PropTypes from 'prop-types';
import { Button, EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import AppLink from '../../../presentational-components/shared/AppLink';
import { fetchRole } from '../../../redux/actions/role-actions.js';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames.js';

const AddRolePermissionSuccess = ({ currentRoleID }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  return (
    <>
      <EmptyState>
        <EmptyStateHeader
          titleText={<>{intl.formatMessage(messages.permissionsAddedSuccessfully)}</>}
          icon={<EmptyStateIcon color="green" icon={CheckCircleIcon} />}
          headingLevel="h4"
        />
        <EmptyStateBody />
        <EmptyStateFooter>
          <AppLink to={pathnames['role-detail'].link.replace(':roleId', currentRoleID)}>
            <Button onClick={() => dispatch(fetchRole(currentRoleID))}>{intl.formatMessage(messages.exit)}</Button>
          </AppLink>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;

AddRolePermissionSuccess.propTypes = {
  currentRoleID: PropTypes.string.isRequired,
};
