import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import {
  type WorkspacesWorkspace,
  isWorkspace,
  useUpdateWorkspaceMutation,
  useWorkspaceQuery,
  useWorkspacesQuery,
} from '../../data/queries/workspaces';
import paths from '../../utilities/pathnames';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';

interface EditWorkspaceModalProps {
  afterSubmit: () => void;
  onCancel: () => void;
}

export const EditWorkspaceModal: React.FunctionComponent<EditWorkspaceModalProps> = ({ afterSubmit, onCancel }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const params = useParams();
  const workspaceId = params.workspaceId;
  const addNotification = useAddNotification();

  // React Query hooks
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspaceQuery(workspaceId || '', {
    enabled: !!workspaceId,
  });
  const { data: workspacesData } = useWorkspacesQuery();
  const allWorkspaces = workspacesData?.data ?? [];
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();

  // Derive initial form data from workspace (no setState needed)
  const initialFormData = useMemo(() => {
    if (workspace) {
      return {
        name: workspace.name,
        description: workspace.description,
      };
    }
    return null;
  }, [workspace]);

  const createEditWorkspaceSchema = useMemo(
    () => ({
      fields: [
        {
          name: 'name',
          label: intl.formatMessage(messages.name),
          component: componentTypes.TEXT_FIELD,
          validate: [
            { type: validatorTypes.REQUIRED },
            (value: string, currData: unknown | WorkspacesWorkspace) => {
              if (isWorkspace(currData)) {
                if (value === initialFormData?.name) {
                  return undefined;
                }
                const isDuplicate = allWorkspaces.some(
                  (existingWorkspace) => existingWorkspace.name.toLowerCase() === value?.toLowerCase() && existingWorkspace.id !== currData.id,
                );
                return isDuplicate ? intl.formatMessage(messages.workspaceNameTaken) : undefined;
              }
            },
          ],
          initialValue: initialFormData?.name,
          isRequired: true,
        },
        {
          name: 'description',
          label: intl.formatMessage(messages.description),
          component: componentTypes.TEXTAREA,
          initialValue: initialFormData?.description,
        },
      ],
    }),
    [initialFormData, workspaceId, intl, allWorkspaces],
  );

  const handleCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.editingWorkspaceTitle),
      description: intl.formatMessage(messages.editingWorkspaceCanceledDescription),
    });
    if (onCancel) {
      onCancel();
    } else {
      // Navigate back to workspace list if no onCancel provided
      navigate(paths.workspaces.link());
    }
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateWorkspaceMutation.mutateAsync({
        id: workspaceId!,
        workspacesPatchWorkspaceRequest: { name: data.name as string, description: data.description as string },
      });

      // Mutation handles cache invalidation and notifications
      if (afterSubmit) {
        afterSubmit();
      } else {
        // Navigate back to workspace list if no afterSubmit provided
        navigate(paths.workspaces.link());
      }
    } catch {
      // If update fails, still call afterSubmit to close modal
      // The error notification is already shown by the mutation
      if (afterSubmit) {
        afterSubmit();
      }
    }
  };

  // Use memoized plain object for initialValues to prevent re-renders
  const formInitialValues = useMemo(() => {
    return workspace ? { ...workspace } : {};
  }, [workspace]);

  // Show loading state while fetching workspace
  if (isWorkspaceLoading) {
    return null;
  }

  return (
    <FormRenderer
      schema={createEditWorkspaceSchema}
      componentMapper={{ ...componentMapper }}
      initialValues={formInitialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      FormTemplate={(props: Record<string, unknown>) => (
        <ModalFormTemplate
          {...props}
          ModalProps={{
            onClose: onCancel,
            isOpen: true,
            variant: 'medium',
            title: 'Edit workspace information',
          }}
        />
      )}
      FormTemplateProps={{
        disableSubmit: ['pristine', 'invalid'],
      }}
    />
  );
};

export default EditWorkspaceModal;
