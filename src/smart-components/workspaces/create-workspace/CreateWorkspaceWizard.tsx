import React from 'react';
import { useDispatch } from 'react-redux';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import { CreateWorkspaceFormValues, schemaBuilder, WORKSPACE_DESCRIPTION, WORKSPACE_NAME } from './schema';
import { createWorkspace } from '../../../redux/actions/workspaces-actions';
import useAppNavigate from '../../../hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import SetEarMark from './SetEarMark';
import Review from './Review';
import SetDetails from './SetDetails';
import { useFlag } from '@unleash/proxy-client-react';

interface CreateWorkspaceWizardProps {
  afterSubmit: () => void;
  onCancel: () => void;
}

const FormTemplate = (props: FormTemplateCommonProps) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  SetDetails,
  SetEarMark,
  Review,
};

export const CreateWorkspaceWizard: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ afterSubmit, onCancel }) => {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const enableFeatures = useFlag('platform.rbac.workspaces-create-features');

  const onSubmit = (values: CreateWorkspaceFormValues) => {
    dispatch(createWorkspace({ name: values[WORKSPACE_NAME], description: values[WORKSPACE_DESCRIPTION] }));
    navigate({ pathname: pathnames.workspaces.link });
    afterSubmit?.();
  };

  return (
    <FormRenderer
      schema={schemaBuilder(enableFeatures)}
      componentMapper={{ ...componentMapper, ...mapperExtension }}
      FormTemplate={FormTemplate}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default CreateWorkspaceWizard;
