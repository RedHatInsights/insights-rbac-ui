import React from 'react';
import { useDispatch } from 'react-redux';
import { useFlag } from '@unleash/proxy-client-react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import { schemaBuilder, WORKSPACE_DESCRIPTION, WORKSPACE_NAME, WORKSPACE_PARENT } from './schema';
import { createWorkspace } from '../../../redux/actions/workspaces-actions';
import SetEarMark from './SetEarMark';
import Review from './Review';
import SetDetails from './SetDetails';

export interface CreateWorkspaceWizardProps {
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
  const dispatch = useDispatch();
  const enableFeatures = useFlag('platform.rbac.workspaces-billing-features');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (_v: any, form: any) => {
    const values = form.getState().values;
    await dispatch(
      createWorkspace({
        name: values[WORKSPACE_NAME],
        description: values[WORKSPACE_DESCRIPTION],
        parent_id: values[WORKSPACE_PARENT].id,
      })
    );
    afterSubmit();
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
