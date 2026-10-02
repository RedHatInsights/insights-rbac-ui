import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../../shared/components/navigation/AppLink';

import pathnames from '../../../utilities/pathnames';

interface AddRolePermissionSuccessProps {
  currentRoleID: string;
}

const AddRolePermissionSuccess: React.FC<AddRolePermissionSuccessProps> = ({ currentRoleID }) => {
  const intl = useIntl();
  return (
    <>
      <EmptyState
        headingLevel="h4"
        icon={CheckCircleIcon}
        titleText={
          <>
            {intl.formatMessage({
              id: 'permissionsAddedSuccessfully',
              defaultMessage: 'You have successfully added permissions to the role',
              description: 'Permissions added successfully message',
            })}
          </>
        }
      >
        <EmptyStateBody />
        <EmptyStateFooter>
          <AppLink to={pathnames['role-detail'].link(currentRoleID)}>
            {/* Button is only for styling - AppLink handles navigation, mutation already invalidated cache */}
            <Button>{intl.formatMessage({ id: 'exit', defaultMessage: 'Exit', description: 'Exit button text' })}</Button>
          </AppLink>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;
