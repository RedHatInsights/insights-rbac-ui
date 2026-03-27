import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import type { FormApi } from 'final-form';
import { useFlag } from '@unleash/proxy-client-react';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import { useLocation } from 'react-router-dom';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../../Messages';
import { type WorkspacesWorkspace, useCreateWorkspaceMutation, useWorkspacesQuery, workspacesKeys } from '../../../data/queries/workspaces';
import { ReviewStep as Review } from './components/Review';
import { WaitForWorkspaceReady } from './components/WaitForWorkspaceReady';
import { WORKSPACE_DESCRIPTION, WORKSPACE_NAME, WORKSPACE_PARENT, schemaBuilder } from './schema';
import { SelectParentWorkspace } from './components/SelectParentWorkspace';
import { SetDetails } from './components/SetDetails';
import { SetEarMark } from './components/SetEarMark';

export interface CreateWorkspaceWizardProps {
  afterSubmit?: () => void;
  onCancel?: () => void;
}

const FormTemplate = (props: FormTemplateCommonProps) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  SelectParentWorkspace,
  SetDetails,
  SetEarMark,
  Review,
};

export const CreateWorkspaceWizard: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ afterSubmit, onCancel }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const enableFeatures = useFlag('platform.rbac.workspaces-billing-features');
  const addNotification = useAddNotification();

  const parentWorkspace = (location.state as { parentWorkspace?: WorkspacesWorkspace } | null)?.parentWorkspace;

  const [createdWorkspace, setCreatedWorkspace] = useState<{ id: string; name: string } | null>(null);

  // React Query hooks — defer side-effects so the progress step controls cache + notification timing
  const { data: workspacesData } = useWorkspacesQuery();
  const existingWorkspaceNames = (workspacesData?.data ?? []).map((w) => w.name).filter((n): n is string => !!n);
  const createWorkspaceMutation = useCreateWorkspaceMutation({ deferSuccessSideEffects: true });

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
    addNotification({
      variant: 'success',
      title: intl.formatMessage(messages.createWorkspaceSuccessTitle, { name: createdWorkspace?.name }),
    });
    if (afterSubmit) {
      afterSubmit();
    } else {
      navigate(pathnames.workspaces.link());
    }
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
    if (afterSubmit) {
      afterSubmit();
    } else {
      navigate(pathnames.workspaces.link());
    }
  };

  const defaultOnCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.createWorkspace),
      description: intl.formatMessage(messages.creatingWorkspaceCancel),
    });
    navigate(pathnames.workspaces.link());
  };

  const onSubmit = async (_v: Record<string, unknown>, form: FormApi) => {
    const values = form.getState().values;
    const result = await createWorkspaceMutation.mutateAsync({
      name: values[WORKSPACE_NAME],
      description: values[WORKSPACE_DESCRIPTION],
      parent_id: values[WORKSPACE_PARENT]?.id,
    });
    setCreatedWorkspace({ id: result.id, name: result.name ?? values[WORKSPACE_NAME] });
  };

  if (createdWorkspace) {
    return <WaitForWorkspaceReady workspace={createdWorkspace} onFinish={handleFinish} onClose={handleClose} />;
  }

  return (
    <FormRenderer
      schema={schemaBuilder(enableFeatures, existingWorkspaceNames)}
      componentMapper={{ ...componentMapper, ...mapperExtension }}
      FormTemplate={FormTemplate}
      onSubmit={onSubmit}
      onCancel={onCancel || defaultOnCancel}
      initialValues={parentWorkspace ? ({ [WORKSPACE_PARENT]: parentWorkspace } as Record<string, unknown>) : undefined}
    />
  );
};

export default CreateWorkspaceWizard;
