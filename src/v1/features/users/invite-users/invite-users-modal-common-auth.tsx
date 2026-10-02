import React from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import { ModalFormTemplate } from '../../../../shared/components/forms/ModalFormTemplate';
import { useIntl } from 'react-intl';

import { componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import AccordionCheckbox from '../../../../shared/components/expandable-checkbox';
import InlineError from '../../../../shared/components/ui-states/InlineError';
import { useCommonAuthModel } from '../../../../capabilities/useCommonAuthModel';
import { useInviteUsersMutation } from '../../../../shared/data/queries/users';
import { useOutletContext } from 'react-router-dom';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { commonMessages } from '../../../../shared/messages/common';

// Portal subscription permission levels (moved from React Query helper)
const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER = 'view_edit_user';
const MANAGE_SUBSCRIPTIONS_VIEW_ALL = 'view_all';
const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL = 'view_edit_all';

const ExpandableCheckboxComponent = 'expandable-checkbox';
const InlineErrorComponent = 'inline-error';
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitValues = {
  'email-addresses': string;
  'customer-portal-permissions'?: {
    'is-org-admin'?: boolean;
    'manage-support-cases'?: boolean;
    'download-software-updates'?: boolean;
    'manage-subscriptions'?:
      | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER
      | typeof MANAGE_SUBSCRIPTIONS_VIEW_ALL
      | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL;
  };
};

const InviteUsers = () => {
  const { fetchData } = useOutletContext<{ fetchData: (isSubmit: boolean) => void }>();
  const { advancedPermissions } = useCommonAuthModel();
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
        portal_manage_subscriptions: typedValues['customer-portal-permissions']?.['manage-subscriptions'],
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
  const schema = React.useMemo(
    () => ({
      description: intl.formatMessage({
        id: 'inviteUsersDescription',
        defaultMessage:
          'Invite users to create a Red Hat login with your organization. Your name will be included in the invite as a point of reference.',
        description: 'Invite users modal description',
      }),
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
          label: intl.formatMessage({
            id: 'inviteUsersFormEmailsFieldTitle',
            defaultMessage: 'Enter the e-mail addresses of the users you would like to invite',
            description: 'Invite users form emails field title',
          }),
          name: 'email-addresses',
          placeholder: intl.formatMessage({
            id: 'inviteUsersFormEmailsFieldDescription',
            defaultMessage: 'Enter up to 50 email addresses separated by commas or returns.',
            description: 'Invite users form emails field description',
          }),
          rows: 5,
          isRequired: true,
          validate: [
            {
              type: validatorTypes.REQUIRED,
            },
            (value: string) =>
              value.split(/[\s,]+/).every((email: string) => EMAIL_REGEXP.test(email))
                ? undefined
                : intl.formatMessage({
                    id: 'inviteUsersFormEmailsFieldError',
                    defaultMessage: 'Some of the email addresses you provided are not valid',
                    description: 'Invite users form emails field error message is one email address is not valid.',
                  }),
          ],
        },
        {
          component: ExpandableCheckboxComponent,
          items: [
            {
              name: 'is-org-admin',
              title: intl.formatMessage({
                id: 'inviteUsersFormIsAdminFieldTitle',
                defaultMessage: 'Organization Administrators',
                description: 'Invite users form is admin field title',
              }),
              description: intl.formatMessage({
                id: 'inviteUsersFormIsAdminFieldDescription',
                defaultMessage:
                  'The organization administrator role is the highest permission level with full access to content and features. This is the only role that can manage users.',
                description: 'Invite users form is admin field description',
              }),
            },
            ...(advancedPermissions
              ? [
                  {
                    name: 'manage-support-cases',
                    title: intl.formatMessage({
                      id: 'inviteUsersFormManageSubscriptionsFieldTitle',
                      defaultMessage: 'Manage your subscriptions',
                      description: 'Invite users form manage subscriptions field title',
                    }),
                    description: intl.formatMessage({
                      id: 'inviteUsersFormManageSubscriptionsFieldDescription',
                      defaultMessage:
                        'Grants user access to subscription management via Red Hat Subscription Management in the Red Hat Customer Portal.',
                      description: 'Invite users form manage subscriptions field description',
                    }),
                  },
                  {
                    name: 'download-software-updates',
                    title: intl.formatMessage({
                      id: 'inviteUsersFormDownloadSoftwareUpdatesFieldTitle',
                      defaultMessage: 'Download software and updates',
                      description: 'Invite users form download software and updates field title',
                    }),
                    description: intl.formatMessage({
                      id: 'inviteUsersFormDownloadSoftwareUpdatesFieldDescription',
                      defaultMessage: 'User can download software and updates from the Red Hat Customer Portal.',
                      description: 'Invite users form download software and updates field description',
                    }),
                  },
                  {
                    name: 'manage-subscriptions',
                    title: intl.formatMessage({
                      id: 'inviteUsersFormManageSubscriptionsFieldTitle',
                      defaultMessage: 'Manage your subscriptions',
                      description: 'Invite users form manage subscriptions field title',
                    }),
                    description: intl.formatMessage({
                      id: 'inviteUsersFormManageSubscriptionsFieldDescription',
                      defaultMessage:
                        'Grants user access to subscription management via Red Hat Subscription Management in the Red Hat Customer Portal.',
                      description: 'Invite users form manage subscriptions field description',
                    }),
                    options: [
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER,
                        title: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewEditUsersOnlyTitle',
                          defaultMessage: 'View/Edit users only',
                          description: 'Invite users form manage subscriptions field View edit Users only title',
                        }),
                        description: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewEditUsersOnlyDescription',
                          defaultMessage: 'User can view and edit only the systems that they have registered in the account.',
                          description: 'Invite users form manage subscriptions field View edit Users only description',
                        }),
                      },
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_ALL,
                        title: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewAllTitle',
                          defaultMessage: 'User can view and edit only the systems that they have registered in the account.',
                          description: 'Invite users form manage subscriptions field view all option title',
                        }),
                        description: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewAllDescription',
                          defaultMessage: 'User can view (but not edit) all systems and Subscription Management Applications in the account.',
                          description: 'Invite users form manage subscriptions field view all option description',
                        }),
                      },
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL,
                        title: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewEditAllTitle',
                          defaultMessage: 'View/Edit all',
                          description: 'Invite users form manage subscriptions field View/Edit all option title',
                        }),
                        description: intl.formatMessage({
                          id: 'inviteUsersFormManageSubscriptionsViewEditAllDescription',
                          defaultMessage: 'User can view and edit all systems and Subscription Management Applications in the account.',
                          description: 'Invite users form manage subscriptions field View/Edit all option description',
                        }),
                      },
                    ],
                  },
                ]
              : []),
          ],
          name: 'customer-portal-permissions',
        },
      ],
    }),
    [responseError],
  );
  return (
    <FormRenderer
      schema={schema}
      componentMapper={{
        ...componentMapper,
        [InlineErrorComponent]: InlineError,
        [ExpandableCheckboxComponent]: AccordionCheckbox,
      }}
      onCancel={onCancel}
      onSubmit={onSubmit}
      FormTemplate={(props) => (
        <ModalFormTemplate
          saveLabel={intl.formatMessage({ id: 'inviteUsersTitle', defaultMessage: 'Invite New Users', description: 'Invite users modal title' })}
          cancelLabel={intl.formatMessage(commonMessages.cancel)}
          alert={undefined}
          {...props}
          ModalProps={{
            onClose: onCancel,
            isOpen: true,
            variant: 'medium',
            title: intl.formatMessage({ id: 'inviteUsersTitle', defaultMessage: 'Invite New Users', description: 'Invite users modal title' }),
          }}
        />
      )}
    />
  );
};

export default InviteUsers;
