import React from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import { ModalFormTemplate } from '../forms/ModalFormTemplate';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import type { Schema } from '@data-driven-forms/react-form-renderer/common-types/schema';
import { pf4Components } from '../../forms/pf4Components';
import AccordionCheckbox from '../expandable-checkbox';
import InlineError from '../ui-states/InlineError';
import { useCommonAuthModel } from '../../../capabilities/useCommonAuthModel';
import { useFedRAMPMode } from '../../../capabilities/useFedRAMPMode';
import { useInviteUsersMutation } from '../../data/queries/users';
import { useOutletContext } from 'react-router-dom';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

const ExpandableCheckboxComponent = 'expandable-checkbox';
const InlineErrorComponent = 'inline-error';

/** Component mapper with literal keys; `InviteUsersSchema` validates the schema below. */
const inviteUsersMapper = {
  ...pf4Components,
  [InlineErrorComponent]: InlineError,
  [ExpandableCheckboxComponent]: AccordionCheckbox,
};

type InviteUsersSchema = Schema<typeof inviteUsersMapper>;

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitValues = {
  'email-addresses': string;
  'customer-portal-permissions'?: {
    'is-org-admin'?: boolean;
    'manage-support-cases'?: boolean;
    'download-software-updates'?: boolean;
  };
};

export const InviteUsers = () => {
  const { fetchData } = useOutletContext<{ fetchData: (isSubmit: boolean) => void }>();
  const { advancedPermissions } = useCommonAuthModel();
  const isITLess = useFedRAMPMode();
  const [responseError, setResponseError] = React.useState<{ title: string; description: string; url?: string } | null>(null);
  const addNotification = useAddNotification();

  const inviteUsersMutation = useInviteUsersMutation();

  const onCancel = () => {
    fetchData(false);
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    const typedValues = values as SubmitValues;
    try {
      const response = await inviteUsersMutation.mutateAsync({
        emails: typedValues['email-addresses']?.split(/[\s,]+/),
        isAdmin: typedValues['customer-portal-permissions']?.['is-org-admin'],
        portal_manage_cases: typedValues['customer-portal-permissions']?.['manage-support-cases'],
        portal_download: typedValues['customer-portal-permissions']?.['download-software-updates'],
      });

      if (response.status === 200 || response.status === 204) {
        addNotification({
          variant: 'success',
          title: 'Invitation sent successfully',
          dismissable: true,
        });
        fetchData(true);
      } else {
        const data = await response.json();
        setResponseError({
          title: data.title,
          description: data.detail,
          url: data.type,
        });
        addNotification({
          variant: 'danger',
          title: data.title || 'Failed to send invitation',
          dismissable: true,
          description: data.detail || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Failed to invite users:', error);
      addNotification({
        variant: 'danger',
        title: 'Failed to send invitation',
        dismissable: true,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
  const intl = useIntl();
  const schema = React.useMemo<InviteUsersSchema>(
    () => ({
      description: intl.formatMessage(messages.inviteUsersDescription),
      fields: [
        ...(responseError
          ? [
              {
                component: InlineErrorComponent,
                title: responseError.title,
                description: responseError.description,
                name: 'response-error',
              },
            ]
          : []),
        {
          component: componentTypes.TEXTAREA,
          label: intl.formatMessage(messages.inviteUsersFormEmailsFieldTitle),
          name: 'email-addresses',
          placeholder: intl.formatMessage(messages.inviteUsersFormEmailsFieldDescription),
          rows: 5,
          isRequired: true,
          validate: [
            {
              type: validatorTypes.REQUIRED,
            },
            (value: string) =>
              value.split(/[\s,]+/).every((email: string) => EMAIL_REGEXP.test(email))
                ? undefined
                : intl.formatMessage(messages.inviteUsersFormEmailsFieldError),
          ],
        },
        {
          component: ExpandableCheckboxComponent,
          items: [
            {
              name: 'is-org-admin',
              title: intl.formatMessage(messages.inviteUsersFormIsAdminFieldTitle),
              description: intl.formatMessage(messages.inviteUsersFormIsAdminFieldDescription),
            },
            // Manage support cases is a shipped field: shown whenever the account API is
            // available (i.e. not ITLess/FedRAMP), independent of the advanced-permissions flag.
            ...(!isITLess
              ? [
                  {
                    name: 'manage-support-cases',
                    title: intl.formatMessage(messages.inviteUsersFormManageSupportCasesFieldTitle),
                    description: intl.formatMessage(messages.inviteUsersFormManageSupportCasesFieldDescription),
                  },
                ]
              : []),
            ...(advancedPermissions
              ? [
                  {
                    name: 'download-software-updates',
                    title: intl.formatMessage(messages.inviteUsersFormDownloadSoftwareUpdatesFieldTitle),
                    description: intl.formatMessage(messages.inviteUsersFormDownloadSoftwareUpdatesFieldDescription),
                  },
                ]
              : []),
          ],
          name: 'customer-portal-permissions',
        },
      ],
    }),
    [responseError, advancedPermissions, isITLess],
  );
  return (
    <FormRenderer
      schema={schema}
      componentMapper={inviteUsersMapper}
      onCancel={onCancel}
      onSubmit={onSubmit}
      FormTemplate={(props) => (
        <ModalFormTemplate
          saveLabel={intl.formatMessage(messages.inviteUsersTitle)}
          cancelLabel={intl.formatMessage(messages.cancel)}
          alert={undefined}
          {...props}
          ModalProps={{ onClose: onCancel, isOpen: true, variant: 'medium', title: intl.formatMessage(messages.inviteUsersTitle) }}
        />
      )}
    />
  );
};

export default InviteUsers;
