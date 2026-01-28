import React, { useMemo, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';

import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { schemaBuilder } from './schema';
import { type ServiceAccount, useAddServiceAccountsToGroupMutationV1, useCreateGroupMutation } from '../../../data/queries/groups';
import { SetName } from './components/stepName/SetName';
import { SetRoles } from './components/stepRoles/SetRoles';
import { SetUsers } from './components/stepUsers/SetUsers';
import SetServiceAccounts from './components/stepServiceAccounts/SetServiceAccounts';
import { SummaryContent } from './components/stepReview/SummaryContent';
import { AddGroupSuccess } from './AddGroupSuccess';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { useWorkspacesFlag } from '../../../hooks/useWorkspacesFlag';
import { AddGroupWizardContext } from './add-group-wizard-context';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

const FormTemplate = (props: React.ComponentProps<typeof Pf4FormTemplate>) => <Pf4FormTemplate {...props} showFormControls={false} />;

// Component mapper extension for wizard steps
const mapperExtension = {
  'set-name': SetName,
  'set-roles': SetRoles,
  'set-users': SetUsers,
  'set-service-accounts': SetServiceAccounts,
  'summary-content': SummaryContent,
  'add-group-success': AddGroupSuccess,
};

interface AddGroupWizardProps {
  // No direct props - component receives data from URL params and context
}

export const AddGroupWizard: React.FC<AddGroupWizardProps> = () => {
  const navigate = useAppNavigate();
  const chrome = useChrome();
  const addNotification = useAddNotification();

  // React Query mutations
  const createGroupMutation = useCreateGroupMutation();
  const addServiceAccountsMutation = useAddServiceAccountsToGroupMutationV1();

  // Feature flags for wizard configuration
  const enableServiceAccounts =
    (chrome.isBeta() && useFlag('platform.rbac.group-service-accounts')) ||
    (!chrome.isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  const enableWorkspaces = useWorkspacesFlag('m5'); // Master flag

  // When workspaces is enabled, roles are disabled (per business logic)
  const enableRoles = !enableWorkspaces;

  const [cancelWarningVisible, setCancelWarningVisible] = useState<boolean>(false);
  const [submitting] = useState<boolean>(false);
  const [submittingError] = useState<string | null>(null);
  const [wizardError, setWizardError] = useState<boolean | undefined>(undefined);
  const [wizardContextValue, setWizardContextValue] = useState<{
    success: boolean;
    submitting: boolean;
    error: string | null;
    setHideForm: () => void;
    setWizardSuccess: (success: boolean) => void;
  }>({
    success: false,
    submitting: false,
    error: null,
    setHideForm: () => {},
    setWizardSuccess: () => {},
  });

  interface FormData {
    'group-name': string;
    'group-description': string;
    'users-list'?: Array<{ label: string; username?: string; value?: string }>;
    'roles-list'?: Array<{ uuid: string; value?: string }>;
    'service-accounts-list'?: ServiceAccount[];
  }

  const onSubmit = async (formData: FormData) => {
    const {
      'group-name': name,
      'group-description': description,
      'users-list': users,
      'roles-list': roles,
      'service-accounts-list': serviceAccounts,
    } = formData;

    // Prepare group data
    const groupData = {
      name,
      description,
      // Add users if any are selected
      user_list: users && users.length > 0 ? users.map((user) => ({ username: user.username || user.label || user.value || '' })) : [],
      // Add roles if any are selected
      roles_list: roles && roles.length > 0 ? roles.map((role) => role.uuid || role.value || '').filter(Boolean) : [],
    };

    try {
      if (serviceAccounts && serviceAccounts.length > 0) {
        const invalidServiceAccounts = serviceAccounts.filter((sa) => !sa || !sa.uuid);
        if (invalidServiceAccounts.length > 0) {
          throw new Error('Invalid service accounts data found');
        }
      }

      // Create group with React Query mutation
      const createdGroup = await createGroupMutation.mutateAsync(groupData);

      // Check if group creation actually succeeded
      if (!createdGroup?.uuid) {
        throw new Error('Group creation failed: No UUID returned.');
      }

      // Handle service accounts separately (if enabled)
      if (serviceAccounts && serviceAccounts.length > 0) {
        await addServiceAccountsMutation.mutateAsync({
          groupId: createdGroup.uuid,
          // ServiceAccount has uuid (which is clientId) - mutation expects string array of clientIds
          serviceAccounts: serviceAccounts.map((sa) => sa.uuid),
        });
      }

      // Success! Show notification
      addNotification({
        variant: 'success',
        title: 'Group created successfully',
        description: 'The group has been created and configured successfully.',
      });
      navigate('/groups');
    } catch (error) {
      let description = 'There was an error creating the group. Please try again.';

      const rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;

      if (rawMessage) {
        const lowerMessage = rawMessage.toLowerCase();

        if (lowerMessage.includes('service account') && lowerMessage.includes('invalid')) {
          description = 'The service account configuration is invalid. Please verify its credentials and permissions.';
        } else if (lowerMessage.includes('validation')) {
          description = 'Some of the group details are invalid. Please review the form fields and try again.';
        }
      }
      console.error('Error creating group:', error);

      addNotification({
        variant: 'danger',
        title: 'Error creating group',
        description: description,
      });
    }
  };

  const onCancelWarningConfirm = () => {
    setCancelWarningVisible(false);
    navigate('/groups');
  };

  const schema = schemaBuilder(enableServiceAccounts, enableRoles);

  const contextValue = useMemo(
    () => ({
      ...wizardContextValue,
      success: false,
      submitting,
      submittingGroup: false,
      submittingServiceAccounts: false,
      error: wizardError !== undefined ? wizardError : submittingError || undefined,
      setHideForm: () => {},
      setWizardSuccess: (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success })),
      setWizardError,
    }),
    [wizardContextValue, wizardError, submitting, submittingError, setWizardError],
  );

  return (
    <AddGroupWizardContext.Provider value={contextValue}>
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
        componentMapper={{ ...componentMapper, ...mapperExtension }}
        onSubmit={onSubmit}
        onCancel={() => setCancelWarningVisible(true)}
      />
    </AddGroupWizardContext.Provider>
  );
};

export default AddGroupWizard;
