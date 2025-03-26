import React, { useEffect, useMemo, useState } from 'react';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import useAppNavigate from '../../hooks/useAppNavigate';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import messages from '../../Messages';
import { RBACStore } from '../../redux/store';
import { fetchWorkspace, fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import { useParams } from 'react-router-dom';
import { updateWorkspace } from '../../redux/actions/workspaces-actions';

const EditWorkspaceModal: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const workspaceId = params.workspaceId;
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
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
            (value: string) => {
              if (value === initialFormData?.name) {
                return undefined;
              }
              const isDuplicate = allWorkspaces.some((existingWorkspace) => existingWorkspace.name.toLowerCase() === value?.toLowerCase());
              return isDuplicate ? intl.formatMessage(messages.groupNameTakenTitle) : undefined;
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
    [initialFormData, workspaceId, intl]
  );

  const returnToPreviousPage = () => {
    navigate(-1);
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.editingRoleTitle),
        description: intl.formatMessage(messages.editingRoleCanceledDescription),
      })
    );
    navigate(-1);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    console.log(data);
    dispatch(updateWorkspace({ uuid: workspaceId, name: data.name, description: data.description }));
    returnToPreviousPage();
  };

  return (
    <FormRenderer
      schema={createEditWorkspaceSchema}
      componentMapper={{ ...componentMapper }}
      initialValues={workspace}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      FormTemplate={(props: any) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'medium', title: 'Edit workspace information' }} />
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
