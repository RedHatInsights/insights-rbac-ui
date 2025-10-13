import { componentTypes } from '@data-driven-forms/react-form-renderer';
import React from 'react';
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
        title: intl.formatMessage(messages.grantAccessInWorkspace, { workspaceName }),
        fields: [
          {
            title: intl.formatMessage(messages.selectUserGroups),
            name: 'select-user-groups',
            nextStep: 'select-roles',
            fields: [
              {
                name: 'user-groups-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v5-u-my-md',
                label: 'This step is currently blank and ready for implementation.',
              },
            ],
          },
          {
            title: intl.formatMessage(messages.selectRoles),
            name: 'select-roles',
            nextStep: 'review',
            fields: [
              {
                name: 'roles-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v5-u-my-md',
                label: 'This step is currently blank and ready for implementation.',
              },
            ],
          },
          {
            title: intl.formatMessage(messages.review),
            name: 'review',
            fields: [
              {
                name: 'review-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v5-u-my-md',
                label: 'This step is currently blank and ready for implementation.',
              },
            ],
          },
        ],
      },
    ],
  };
};
