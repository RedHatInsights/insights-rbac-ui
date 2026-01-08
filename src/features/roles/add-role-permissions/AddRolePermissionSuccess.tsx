import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import { fetchRole } from '../../../redux/roles/actions';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface AddRolePermissionSuccessProps {
  currentRoleID: string;
}

const AddRolePermissionSuccess: React.FC<AddRolePermissionSuccessProps> = ({ currentRoleID }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  return (
    <>
      <EmptyState headingLevel="h4" icon={CheckCircleIcon} titleText={<>{intl.formatMessage(messages.permissionsAddedSuccessfully)}</>}>
        <EmptyStateBody />
        <EmptyStateFooter>
          <AppLink to={pathnames['role-detail'].link.replace(':roleId', currentRoleID)}>
            <Button onClick={() => dispatch(fetchRole(currentRoleID) as unknown as { type: string })}>{intl.formatMessage(messages.exit)}</Button>
          </AppLink>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;
