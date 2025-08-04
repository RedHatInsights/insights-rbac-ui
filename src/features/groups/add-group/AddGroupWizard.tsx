import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Wizard } from '@patternfly/react-core/deprecated';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { schemaBuilder } from './schema';
import { addGroup, addServiceAccountsToGroup } from '../../../redux/groups/actions';
import { SetName } from './SetName';
import { SetRoles } from './SetRoles';
import { SetUsers } from './SetUsers';
import SetServiceAccounts from './set-service-accounts';
import { SummaryContent } from './SummaryContent';
import { AddGroupSuccess } from './add-group-success';
import useAppNavigate from '../../../hooks/useAppNavigate';
import paths from '../../../utilities/pathnames';
import { AddGroupWizardContext } from './add-group-wizard-context';

const FormTemplate = (props: any) => <Pf4FormTemplate {...props} showFormControls={false} />;

const Description = ({ Content, ...rest }: { Content: React.ComponentType<any>; [key: string]: any }) => <Content {...rest} />;

interface AddGroupWizardProps {
  // No direct props - component receives data from URL params and context
}

export const AddGroupWizard: React.FC<AddGroupWizardProps> = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const [cancelWarningVisible, setCancelWarningVisible] = useState<boolean>(false);

  const container = useRef<HTMLDivElement>(null);

  const onSubmit = async (formData: any) => {
    const {
      'group-name': name,
      'group-description': description,
      'users-list': users,
      'roles-list': roles,
      'set-service-accounts': serviceAccounts,
    } = formData;

    const groupData = {
      name,
      description,
    };

    try {
      const newGroup = await (dispatch(addGroup(groupData)) as any);
      const promises: Promise<any>[] = [];

      if (users?.length > 0) {
        promises.push(
          dispatch(
            addGroup({
              ...groupData,
              user_list: users.map((user: any) => ({ username: user.label })),
            }),
          ) as any,
        );
      }

      if (roles?.length > 0) {
        promises.push(
          dispatch(
            addGroup({
              ...groupData,
              roles_list: roles.map((role: any) => role.uuid),
            }),
          ) as any,
        );
      }

      if (serviceAccounts?.length > 0) {
        promises.push(dispatch(addServiceAccountsToGroup(newGroup.uuid, serviceAccounts)) as any);
      }

      await Promise.all(promises);

      dispatch(
        addNotification({
          variant: 'success',
          title: 'Group created successfully',
          description: 'The group has been created and configured successfully.',
        }) as any,
      );

      const pathname = `${paths['group-detail'].link.split('/').slice(0, -1).join('/')}/${newGroup.uuid}`;
      navigate(pathname);
    } catch {
      dispatch(
        addNotification({
          variant: 'danger',
          title: 'Error creating group',
          description: 'There was an error creating the group. Please try again.',
        }) as any,
      );
    } finally {
    }
  };

  const onCancelWarningConfirm = () => {
    setCancelWarningVisible(false);
    navigate('/groups');
  };

  const schema = schemaBuilder(container.current, intl);

  const renderWizard = (props: any) => {
    const { fields, handleSubmit, getState } = props;

    return (
      <Wizard
        className="rbac"
        title="Create group"
        description="Create a new group and configure its settings"
        steps={fields.map((field: any) => ({
          name: field.title,
          component: (
            <Description
              Content={field.component}
              {...field}
              formOptions={{
                ...field.formOptions,
                getState,
                handleSubmit,
              }}
            />
          ),
          isDisabled: field.isDisabled && field.isDisabled(getState()),
        }))}
        onNext={(step: any) => {
          setCurrentStepName(step.name);
        }}
        onBack={(step: any) => {
          setCurrentStepName(step.name);
        }}
        onSubmit={handleSubmit}
        isNavExpandable
      />
    );
  };

  return (
    <AddGroupWizardContext.Provider value={wizardContextValue}>
      <div ref={container}>
        {cancelWarningVisible && (
          <WarningModal
            isOpen={cancelWarningVisible}
            title="Exit group creation?"
            confirmButtonLabel="Exit"
            onClose={() => setCancelWarningVisible(false)}
            onConfirm={onCancelWarningConfirm}
          >
            {'All unsaved changes will be lost. Are you sure you want to exit?'}
          </WarningModal>
        )}
        <FormRenderer
          schema={schema}
          subscription={{ values: true }}
          FormTemplate={FormTemplate}
          componentMapper={{
            ...componentMapper,
            'set-name': SetName,
            'set-roles': SetRoles,
            'set-users': SetUsers,
            'set-service-accounts': SetServiceAccounts,
            'summary-content': SummaryContent,
            'add-group-success': AddGroupSuccess,
            wizard: renderWizard,
          }}
          onSubmit={onSubmit}
        />
      </div>
    </AddGroupWizardContext.Provider>
  );
};
