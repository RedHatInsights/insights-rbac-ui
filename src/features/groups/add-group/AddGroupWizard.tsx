import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
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
import SetServiceAccounts from './SetServiceAccounts';
import { SummaryContent } from './SummaryContent';
import { AddGroupSuccess } from './AddGroupSuccess';
import useAppNavigate from '../../../hooks/useAppNavigate';
import paths from '../../../utilities/pathnames';
import { AddGroupWizardContext } from './add-group-wizard-context';

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
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const chrome = useChrome();

  // Feature flags for wizard configuration
  const enableServiceAccounts =
    (chrome.isBeta() && useFlag('platform.rbac.group-service-accounts')) ||
    (!chrome.isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  const enableWorkspaces = useFlag('platform.rbac.workspaces');

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

  const container = useRef<HTMLDivElement>(null);

  interface FormData {
    'group-name': string;
    'group-description': string;
    'users-list'?: Array<{ label: string; username?: string; value?: string }>;
    'roles-list'?: Array<{ uuid: string; value?: string }>;
    'set-service-accounts'?: string[];
  }

  const onSubmit = async (formData: FormData) => {
    const {
      'group-name': name,
      'group-description': description,
      'users-list': users,
      'roles-list': roles,
      'set-service-accounts': serviceAccounts,
    } = formData;

    // Prepare all group data for single API call
    const groupData = {
      name,
      description,
      // Add users if any are selected
      user_list: users && users.length > 0 ? users.map((user) => ({ username: user.username || user.label || user.value || '' })) : [],
      // Add roles if any are selected
      roles_list: roles && roles.length > 0 ? roles.map((role) => role.uuid || role.value || '').filter(Boolean) : [],
    };

    try {
      // Create group with all data in one call
      console.log('🚀 Starting group creation with data:', groupData);
      const newGroupAction = dispatch(addGroup(groupData)) as { payload: Promise<any> };
      const newGroup = await newGroupAction.payload;
      console.log('✅ Group created successfully:', newGroup);

      // Check if group creation actually succeeded
      if (newGroup?.error) {
        throw new Error('Group creation returned error: ' + JSON.stringify(newGroup.error));
      }

      // Handle service accounts separately (if enabled)
      if (serviceAccounts && serviceAccounts.length > 0) {
        console.log('⚙️ Adding service accounts:', serviceAccounts);
        const serviceAccountObjects = serviceAccounts.map((sa) => ({ uuid: sa }));
        const serviceAccountAction = dispatch(addServiceAccountsToGroup(newGroup.uuid, serviceAccountObjects)) as { payload: Promise<unknown> };
        await serviceAccountAction.payload;
        console.log('✅ Service accounts added successfully');
      }

      // Success! Show notification
      dispatch(
        addNotification({
          variant: 'success',
          title: 'Group created successfully',
          description: 'The group has been created and configured successfully.',
        }),
      );

      // Navigate to the new group or groups list (in separate try-catch to not fail group creation)
      try {
        if (newGroup?.uuid) {
          const pathname = `${paths['group-detail'].link.split('/').slice(0, -1).join('/')}/${newGroup.uuid}`;
          console.log('🔄 Navigating to:', pathname);
          navigate(pathname);
        } else {
          console.warn('⚠️ No UUID returned, navigating to groups list');
          navigate('/groups');
        }
      } catch (navError) {
        console.error('❌ Navigation error (but group was created successfully):', navError);
        // Still try to go back to groups list
        navigate('/groups');
      }
    } catch (error) {
      console.error('❌ Error creating group:', error);
      dispatch(
        addNotification({
          variant: 'danger',
          title: 'Error creating group',
          description: 'There was an error creating the group. Please try again.',
        }),
      );
    } finally {
      console.log('🏁 Group creation process completed');
    }
  };

  const onCancelWarningConfirm = () => {
    setCancelWarningVisible(false);
    navigate('/groups');
  };

  const schema = schemaBuilder(container.current, enableServiceAccounts, enableRoles);

  return (
    <AddGroupWizardContext.Provider
      value={{
        ...wizardContextValue,
        success: false,
        submitting,
        submittingGroup: false,
        submittingServiceAccounts: false,
        error: wizardError !== undefined ? wizardError : submittingError || undefined,
        setHideForm: () => {},
        setWizardSuccess: (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success })),
        setWizardError,
      }}
    >
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
          componentMapper={{ ...componentMapper, ...mapperExtension }}
          onSubmit={onSubmit}
          onCancel={() => setCancelWarningVisible(true)}
        />
      </div>
    </AddGroupWizardContext.Provider>
  );
};
