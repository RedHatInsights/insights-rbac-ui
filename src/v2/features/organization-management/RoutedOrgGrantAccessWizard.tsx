import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import pathnames from '../../utilities/pathnames';
import messages from '../../../Messages';
import { GrantAccessWizard } from '../workspaces/grant-access/GrantAccessWizard';
import { AppPlaceholder } from '../../../shared/components/ui-states/LoaderPlaceholders';

/**
 * Route wrapper for the organization-wide Grant Access wizard.
 * Reads organization data from identity, provides navigation callbacks,
 * and is fully self-contained from a cold URL.
 */
export const RoutedOrgGrantAccessWizard: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { organizationId, organizationName, isLoading } = useOrganizationData();

  const tenantResourceId = organizationId ? `redhat/${organizationId}` : '';

  const goBack = useCallback(() => navigate(pathnames['organization-management'].link()), [navigate]);

  if (isLoading || !organizationId) {
    return <AppPlaceholder />;
  }

  return (
    <GrantAccessWizard
      workspaceName={organizationName || intl.formatMessage(messages.organizationWideAccessTitle)}
      workspaceId={tenantResourceId}
      resourceType="tenant"
      afterSubmit={goBack}
      onCancel={goBack}
    />
  );
};

export default RoutedOrgGrantAccessWizard;
