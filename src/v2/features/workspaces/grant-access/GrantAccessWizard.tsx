import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import React from 'react';

import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import { useGrantAccessMutation } from '../../../data/queries/workspaces';
import { schemaBuilder } from './schema';
import UserGroupsSelectionField from './components/UserGroupsSelectionField';
import RolesSelectionField from './components/RolesSelectionField';
import ReviewSelection from './components/ReviewSelection';

export interface GrantAccessWizardProps {
  workspaceName: string;
  workspaceId: string;
  afterSubmit?: () => void;
  onCancel?: () => void;
}

const FormTemplate = (props: FormTemplateCommonProps) => <Pf4FormTemplate {...props} showFormControls={false} />;

const customComponentMapper = {
  ...componentMapper,
  'user-groups-selection': UserGroupsSelectionField,
  'roles-selection': RolesSelectionField,
  'review-selection': ReviewSelection,
};

export const GrantAccessWizard: React.FunctionComponent<GrantAccessWizardProps> = ({ workspaceName, workspaceId, afterSubmit, onCancel }) => {
  const navigate = useAppNavigate();
  const batchCreateMutation = useGrantAccessMutation();

  const defaultAfterSubmit = () => {
    navigate(pathnames.workspaces.link());
  };

  const defaultOnCancel = () => {
    navigate(pathnames.workspaces.link());
  };

  // DDF wizard's handleSubmit calls onSubmit(prepareValues(...), formOptions, state).
  // The first argument is the wizard-prepared values object containing only fields
  // from visited steps — use it directly instead of re-reading from formOptions.getState().
  const onSubmit = (values: Record<string, unknown>) => {
    const groupIds = (values['selected-user-groups'] as string[]) || [];
    const roleIds = (values['selected-roles'] as string[]) || [];

    if (groupIds.length === 0 || roleIds.length === 0) return;

    batchCreateMutation.mutate({ workspaceId, groupIds, roleIds }, { onSuccess: () => (afterSubmit || defaultAfterSubmit)() });
  };

  return (
    <FormRenderer
      schema={schemaBuilder(workspaceName)}
      componentMapper={customComponentMapper}
      FormTemplate={FormTemplate}
      onSubmit={onSubmit}
      onCancel={onCancel || defaultOnCancel}
    />
  );
};

export default GrantAccessWizard;
