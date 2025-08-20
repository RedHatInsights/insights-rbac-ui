import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import { useFlag } from '@unleash/proxy-client-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import useAppNavigate from '../../../hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import { createWorkspace, fetchWorkspaces } from '../../../redux/workspaces/actions';
import { ReviewStep as Review } from './components/Review';
import { WORKSPACE_DESCRIPTION, WORKSPACE_NAME, WORKSPACE_PARENT, schemaBuilder } from './schema';
import { SetDetails } from './components/SetDetails';
import { SetEarMark } from './components/SetEarMark';

export interface CreateWorkspaceWizardProps {
  afterSubmit?: () => void;
  onCancel?: () => void;
}

const FormTemplate = (props: FormTemplateCommonProps) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  SetDetails,
  SetEarMark,
  Review,
};

export const CreateWorkspaceWizard: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ afterSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const enableFeatures = useFlag('platform.rbac.workspaces-billing-features');

  // Default handlers for when component is used as a route element
  const defaultAfterSubmit = () => {
    // Refresh workspaces list to show the newly created workspace
    dispatch(fetchWorkspaces());
    navigate(pathnames.workspaces.link);
  };

  const defaultOnCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.createWorkspace),
        description: intl.formatMessage(messages.creatingWorkspaceCancel),
      }),
    );
    navigate(pathnames.workspaces.link);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (_v: any, form: any) => {
    const values = form.getState().values;
    await dispatch(
      createWorkspace({
        name: values[WORKSPACE_NAME],
        description: values[WORKSPACE_DESCRIPTION],
        parent_id: values[WORKSPACE_PARENT].id,
      }),
    );
    (afterSubmit || defaultAfterSubmit)();
  };

  return (
    <FormRenderer
      schema={schemaBuilder(enableFeatures)}
      componentMapper={{ ...componentMapper, ...mapperExtension }}
      FormTemplate={FormTemplate}
      onSubmit={onSubmit}
      onCancel={onCancel || defaultOnCancel}
    />
  );
};

export default CreateWorkspaceWizard;
