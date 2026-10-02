import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyWithAction } from '../../../../../shared/components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../../../../shared/components/navigation/Breadcrumbs';

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
      <section className="pf-v6-c-page__main-breadcrumb pf-v6-u-pb-md">
        <RbacBreadcrumbs breadcrumbs={breadcrumbsList} />
      </section>
      <EmptyWithAction
        title={intl.formatMessage({ id: 'groupNotFound', defaultMessage: 'Group not found', description: 'Group not found message' })}
        description={[
          intl.formatMessage(
            {
              id: 'groupDoesNotExist',
              defaultMessage: 'Group with ID {id} does not exist.',
              description: 'Group with given ID does not exist message',
            },
            { id: groupId },
          ),
        ]}
        actions={[
          <Button
            key="back-button"
            className="pf-v6-u-mt-xl"
            ouiaId="back-button"
            variant="primary"
            aria-label="Back to previous page"
            onClick={onNavigateBack}
          >
            {intl.formatMessage({ id: 'backToPreviousPage', defaultMessage: 'Back to previous page', description: 'Back to previous page label' })}
          </Button>,
        ]}
      />
    </Fragment>
  );
};
