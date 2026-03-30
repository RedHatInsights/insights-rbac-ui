import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { useWorkspaceQuery } from '../../../data/queries/workspaces';
import pathnames from '../../../utilities/pathnames';
import { GrantAccessWizard } from './GrantAccessWizard';
import { AppPlaceholder } from '../../../../shared/components/ui-states/LoaderPlaceholders';

/**
 * Route wrapper for GrantAccessWizard.
 * Reads workspaceId from params, fetches workspace name, and provides
 * navigation callbacks so the wizard is fully self-contained from a cold URL.
 */
export const RoutedGrantAccessWizard: React.FC = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const navigate = useAppNavigate();

  const { data: workspace, isLoading } = useWorkspaceQuery(workspaceId, {
    enabled: !!workspaceId,
  });

  const goToDirectRoles = useCallback(() => navigate(pathnames['workspace-detail-direct-roles'].link(workspaceId)), [navigate, workspaceId]);

  const notFound = !isLoading && !workspace;
  useEffect(() => {
    if (notFound) goToDirectRoles();
  }, [notFound, goToDirectRoles]);

  if (isLoading || !workspace) {
    return notFound ? null : <AppPlaceholder />;
  }

  return (
    <GrantAccessWizard
      workspaceName={workspace.name ?? ''}
      workspaceId={workspaceId}
      resourceType="workspace"
      afterSubmit={goToDirectRoles}
      onCancel={goToDirectRoles}
    />
  );
};

export default RoutedGrantAccessWizard;
