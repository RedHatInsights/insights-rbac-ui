import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import { fetchWorkspace, fetchWorkspaces, updateWorkspace } from '../../redux/actions/workspaces-actions';
import { Workspace, isWorkspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import paths from '../../utilities/pathnames';
import ModalFormTemplate from '../common/ModalFormTemplate';

interface EditWorkspaceModalProps {
  afterSubmit: () => void;
  onCancel: () => void;
}

const EditWorkspaceModal: React.FunctionComponent<EditWorkspaceModalProps> = ({ afterSubmit, onCancel }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const workspaceId = params.workspaceId;
  const [initialFormData, setInitialFormData] = useState<{
    name?: string;
    description?: string;
  } | null>(null);
  const workspace = useSelector((state: RBACStore) => state.workspacesReducer.selectedWorkspace);
  const allWorkspaces = useSelector((state: RBACStore) => state.workspacesReducer.workspaces || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(fetchWorkspaces()), workspaceId ? dispatch(fetchWorkspace(workspaceId)) : Promise.resolve()]);
      } finally {
        if (workspace) {
          setInitialFormData({
            name: workspace.name,
            description: workspace.description,
          });
        }
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
    [initialFormData, workspaceId, intl],
  );

  const returnToPreviousPage = () => {
    navigate(paths['workspace-detail'].link.replace(':workspaceId', workspaceId ?? ''));
  };

  const handleCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.editingWorkspaceTitle),
        description: intl.formatMessage(messages.editingWorkspaceCanceledDescription),
      }),
    );
    onCancel();
  };

  const handleSubmit = async (data: Record<string, any>) => {
    dispatch(
      updateWorkspace({
        id: workspaceId!,
        workspacesPatchWorkspaceRequest: { name: data.name, description: data.description },
      }),
    );
    returnToPreviousPage();
    afterSubmit();
  };

  return (
    <FormRenderer
      schema={createEditWorkspaceSchema}
      componentMapper={{ ...componentMapper }}
      initialValues={workspace}
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
      debug={(values) => {
        console.log('values:', values);
      }}
    />
  );
};

export default EditWorkspaceModal;
