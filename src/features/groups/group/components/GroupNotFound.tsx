import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core';
import { EmptyWithAction } from '../../../../components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../../../components/navigation/Breadcrumbs';
import messages from '../../../../Messages';

interface GroupNotFoundProps {
  /**
   * The group ID that was not found
   */
  groupId?: string;

  /**
   * Breadcrumbs list for navigation
   */
  breadcrumbsList: Array<{
    title?: string;
    to?: string;
    isActive?: boolean;
  }>;

  /**
   * Handler for navigating back to the previous page
   */
  onNavigateBack: () => void;
}

/**
 * Component displayed when a group cannot be found
 * Shows error message and provides navigation back to groups list
 */
export const GroupNotFound: React.FC<GroupNotFoundProps> = ({ groupId, breadcrumbsList, onNavigateBack }) => {
  const intl = useIntl();

  return (
    <Fragment>
      <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
        <RbacBreadcrumbs breadcrumbs={breadcrumbsList} />
      </section>
      <EmptyWithAction
        title={intl.formatMessage(messages.groupNotFound)}
        description={[intl.formatMessage(messages.groupDoesNotExist, { id: groupId })]}
        actions={[
          <Button
            key="back-button"
            className="pf-v5-u-mt-xl"
            ouiaId="back-button"
            variant="primary"
            aria-label="Back to previous page"
            onClick={onNavigateBack}
          >
            {intl.formatMessage(messages.backToPreviousPage)}
          </Button>,
        ]}
      />
    </Fragment>
  );
};
