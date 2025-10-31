import { createIntl, createIntlCache } from 'react-intl';
import { locale } from '../../../locales/locale';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';

export interface GrantAccessFormValues {
  // Add form fields here when needed
}

export const schemaBuilder = (workspaceName: string) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        'data-ouia-component-id': 'grant-access-wizard',
        inModal: true,
        showTitles: true,
        disableForwardJumping: true,
        title: intl.formatMessage(messages.grantAccessInWorkspace, { workspaceName }),
        fields: [
          {
            title: intl.formatMessage(messages.selectUserGroups),
            name: 'select-user-groups',
            nextStep: 'select-roles',
            fields: [
              {
                name: 'selected-user-groups',
                component: 'user-groups-selection',
                isRequired: true,
              },
            ],
          },
          {
            title: 'Select role(s)',
            name: 'select-roles',
            nextStep: 'review',
            fields: [
              {
                name: 'roles-placeholder',
                component: 'plain-text',
                label: 'Role selection will be implemented here',
              },
            ],
          },
          {
            title: intl.formatMessage(messages.review),
            name: 'review',
            fields: [
              {
                name: 'review-selection',
                component: 'review-selection',
              },
            ],
          },
        ],
      },
    ],
  };
};
