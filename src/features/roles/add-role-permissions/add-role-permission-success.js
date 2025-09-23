import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import { fetchRole } from '../../../redux/roles/actions';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

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
