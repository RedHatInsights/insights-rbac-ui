import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import { fetchWorkspace, fetchWorkspaces, updateWorkspace } from '../../redux/workspaces/actions';
import { Workspace, isWorkspace } from '../../redux/workspaces/reducer';
import { selectSelectedWorkspace, selectWorkspaces } from '../../redux/workspaces/selectors';
import paths from '../../utilities/pathnames';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';

interface EditWorkspaceModalProps {
  afterSubmit: () => void;
  onCancel: () => void;
}

export const EditWorkspaceModal: React.FunctionComponent<EditWorkspaceModalProps> = ({ afterSubmit, onCancel }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const workspaceId = params.workspaceId;
  const workspace = useSelector(selectSelectedWorkspace);
  const allWorkspaces = useSelector(selectWorkspaces);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(fetchWorkspaces()), workspaceId ? dispatch(fetchWorkspace(workspaceId)) : Promise.resolve()]);
      } catch (error) {
        // Handle fetch error
        console.error('Failed to fetch workspace data:', error);
      }
    };
    fetchData();
  }, [dispatch, workspaceId]);

  const createEditWorkspaceSchema = useMemo(
    () => ({
      fields: [
        {
          name: 'name',
          label: intl.formatMessage(messages.name),
          component: componentTypes.TEXT_FIELD,
          validate: [
            { type: validatorTypes.REQUIRED },
            (value: string, currData: unknown | Workspace) => {
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
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.editingWorkspaceTitle),
        description: intl.formatMessage(messages.editingWorkspaceCanceledDescription),
      }),
    );
    if (onCancel) {
      onCancel();
    } else {
      // Navigate back to workspace list if no onCancel provided
      navigate(paths.workspaces.link);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await dispatch(
        updateWorkspace({
          id: workspaceId!,
          workspacesPatchWorkspaceRequest: { name: data.name, description: data.description },
        }),
      );

      // Refetch workspaces to update the list (don't await - let it run in background)
      dispatch(fetchWorkspaces());

      if (afterSubmit) {
        afterSubmit();
      } else {
        // Navigate back to workspace list if no afterSubmit provided
        navigate(paths.workspaces.link);
      }
    } catch {
      // If update fails, still call afterSubmit to close modal
      // The error notification is already shown by the redux action
      if (afterSubmit) {
        afterSubmit();
      }
    }
  };

  // Use memoized plain object for initialValues to prevent re-renders
  const formInitialValues = useMemo(() => {
    return workspace ? { ...workspace } : {};
  }, [workspace]);

  return (
    <FormRenderer
      schema={createEditWorkspaceSchema}
      componentMapper={{ ...componentMapper }}
      initialValues={formInitialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      FormTemplate={(props: any) => (
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
