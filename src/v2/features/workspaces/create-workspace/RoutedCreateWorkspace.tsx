import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppPlaceholder } from '../../../../shared/components/ui-states/LoaderPlaceholders';
import { type WorkspacesWorkspace, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { CreateWorkspaceWizard, type CreateWorkspaceWizardProps } from './CreateWorkspaceWizard';

interface RoutedCreateWorkspaceProps extends CreateWorkspaceWizardProps {
  mode: 'sub' | 'sibling';
}

/**
 * Route wrapper that resolves the target workspace from :workspaceId,
 * computes the parent (self for sub, parent_id for sibling),
 * and renders CreateWorkspaceWizard with skipParentStep=true.
 */
export const RoutedCreateWorkspace: React.FC<RoutedCreateWorkspaceProps> = ({ mode, ...wizardProps }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspacesData, isLoading } = useWorkspacesQuery();

  const parentWorkspace = useMemo<WorkspacesWorkspace | undefined>(() => {
    const allWorkspaces = workspacesData?.data ?? [];
    const target = allWorkspaces.find((ws) => ws.id === workspaceId);
    if (!target) return undefined;

    if (mode === 'sub') return target;

    const parent = allWorkspaces.find((ws) => ws.id === target.parent_id);
    return parent;
  }, [workspacesData, workspaceId, mode]);

  const onCancel = wizardProps.onCancel;
  const notFound = !isLoading && !parentWorkspace;
  useEffect(() => {
    if (notFound) onCancel?.();
  }, [notFound, onCancel]);

  if (isLoading || notFound) {
    return notFound ? null : <AppPlaceholder />;
  }

  return <CreateWorkspaceWizard {...wizardProps} skipParentStep parentWorkspace={parentWorkspace} />;
};

export default RoutedCreateWorkspace;
