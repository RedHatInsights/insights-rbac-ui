import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import React from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import useAppNavigate from '../../../hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import { schemaBuilder } from './schema';
import UserGroupsSelectionField from './components/UserGroupsSelectionField';
import RolesSelectionField from './components/RolesSelectionField';
import ReviewSelection from './components/ReviewSelection';

export interface GrantAccessWizardProps {
  workspaceName: string;
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

export const GrantAccessWizard: React.FunctionComponent<GrantAccessWizardProps> = ({ workspaceName, afterSubmit, onCancel }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();

  const defaultAfterSubmit = () => {
    navigate(pathnames.workspaces.link);
  };

  const defaultOnCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.grantAccess),
      description: 'Grant access cancelled',
    });
    navigate(pathnames.workspaces.link);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (_v: any, form: any) => {
    const values = form.getState().values;
    console.log('Grant access values:', values);
    (afterSubmit || defaultAfterSubmit)();
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
