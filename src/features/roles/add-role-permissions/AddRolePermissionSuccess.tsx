import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface AddRolePermissionSuccessProps {
  currentRoleID: string;
}

const AddRolePermissionSuccess: React.FC<AddRolePermissionSuccessProps> = ({ currentRoleID }) => {
  const intl = useIntl();
  return (
    <>
      <EmptyState headingLevel="h4" icon={CheckCircleIcon} titleText={<>{intl.formatMessage(messages.permissionsAddedSuccessfully)}</>}>
        <EmptyStateBody />
        <EmptyStateFooter>
          <AppLink to={pathnames['role-detail'].link(currentRoleID)}>
            {/* Button is only for styling - AppLink handles navigation, mutation already invalidated cache */}
            <Button>{intl.formatMessage(messages.exit)}</Button>
          </AppLink>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;
