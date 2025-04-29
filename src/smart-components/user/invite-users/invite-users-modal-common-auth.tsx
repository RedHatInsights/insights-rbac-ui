import React from 'react';
import FormRenderer from '../../common/form-renderer';
import ModalFormTemplate from '../../common/ModalFormTemplate';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import AccordionCheckbox from '../../common/expandable-checkbox';
import InlineError from '../../common/inline-error';
import { addUsers } from '../../../redux/actions/user-actions';
import { useDispatch } from 'react-redux';
import { useFlag } from '@unleash/proxy-client-react';
import {
  MANAGE_SUBSCRIPTIONS_VIEW_ALL,
  MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL,
  MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER,
} from '../../../helpers/user/user-helper';
import { useOutletContext } from 'react-router-dom';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const ExpandableCheckboxComponent = 'expandable-checkbox';
const InlineErrorComponent = 'inline-error';
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitValues = {
  'email-addresses': string;
  'invite-message'?: string;
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
  const advancedPermissions = useFlag('platform.rbac.common-auth-model_advanced-permissions');
  const [token, setToken] = React.useState<string | null>(null);
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [responseError, setResponseError] = React.useState<{ title: string; description: string; url?: string } | null>(null);
  const { auth, isProd } = useChrome();
  const dispatch = useDispatch();
  const onCancel = () => {
    fetchData(false);
  };

  React.useEffect(() => {
    const getToken = async () => {
      setAccountId((await auth.getUser())?.identity?.org_id as string);
      setToken((await auth.getToken()) as string);
    };
    getToken();
  }, [auth]);
  const onSubmit = (values: SubmitValues) => {
    const action = addUsers(
      {
        emails: values['email-addresses']?.split(/[\s,]+/),
        message: values['invite-message'],
        isAdmin: values['customer-portal-permissions']?.['is-org-admin'],
        portal_manage_cases: values['customer-portal-permissions']?.['manage-support-cases'],
        portal_download: values['customer-portal-permissions']?.['download-software-updates'],
        portal_manage_subscriptions: values['customer-portal-permissions']?.['manage-subscriptions'],
      },
      { isProd: isProd(), token, accountId }
    );
    action.payload.then(async (response) => {
      if (response.status === 200 || response.status === 204) {
        fetchData(true);
      } else {
        const data = await response.json();
        setResponseError({
          title: data.title,
          description: data.detail,
          url: data.type,
        });
      }
    });
    dispatch(action);
  };
  const intl = useIntl();
  const schema = React.useMemo(
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
          component: componentTypes.TEXTAREA,
          label: intl.formatMessage(messages.inviteUsersMessageTitle),
          name: 'invite-message',
          rows: 3,
        },
        {
          component: ExpandableCheckboxComponent,
          items: [
            {
              name: 'is-org-admin',
              title: intl.formatMessage(messages.inviteUsersFormIsAdminFieldTitle),
              description: intl.formatMessage(messages.inviteUsersFormIsAdminFieldDescription),
            },
            ...(advancedPermissions
              ? [
                  {
                    name: 'manage-support-cases',
                    title: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsFieldTitle),
                    description: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsFieldDescription),
                  },
                  {
                    name: 'download-software-updates',
                    title: intl.formatMessage(messages.inviteUsersFormDownloadSoftwareUpdatesFieldTitle),
                    description: intl.formatMessage(messages.inviteUsersFormDownloadSoftwareUpdatesFieldDescription),
                  },
                  {
                    name: 'manage-subscriptions',
                    title: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsFieldTitle),
                    description: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsFieldDescription),
                    options: [
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER,
                        title: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewEditUsersOnlyTitle),
                        description: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewEditUsersOnlyDescription),
                      },
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_ALL,
                        title: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewAllTitle),
                        description: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewAllDescription),
                      },
                      {
                        name: MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL,
                        title: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewEditAllTitle),
                        description: intl.formatMessage(messages.inviteUsersFormManageSubscriptionsViewEditAllDescription),
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
    [responseError]
  );
  return (
    <FormRenderer
      schema={schema}
      formFields={[]}
      componentMapper={{
        ...componentMapper,
        [InlineErrorComponent]: InlineError,
        [ExpandableCheckboxComponent]: AccordionCheckbox,
      }}
      onCancel={onCancel}
      onSubmit={onSubmit}
      FormTemplate={(props: unknown[]) => (
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
