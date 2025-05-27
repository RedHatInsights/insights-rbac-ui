import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import ReviewTemplate from './review-template';
import ReviewStepButtons from '../../common/review-step-buttons';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import { locale } from '../../../locales/locale';
import { AddGroupWizardContext } from './add-group-wizard-context';

export const schemaBuilder = (container, enableServiceAccounts, enableRoles) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        className: 'rbac',
        isDynamic: true,
        inModal: true,
        showTitles: true,
        title: intl.formatMessage(messages.createGroup),
        'data-ouia-component-id': 'add-group-wizard',
        container,
        fields: [
          {
            name: 'name-and-description',
            nextStep: enableRoles ? 'add-roles' : 'add-users',
            title: intl.formatMessage(messages.nameAndDescription),
            fields: [
              {
                component: 'set-name',
                name: 'group-name',
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                ],
              },
              {
                component: componentTypes.TEXTAREA,
                name: 'group-description',
                hideField: true,
                validate: [
                  {
                    type: validatorTypes.MAX_LENGTH,
                    threshold: 150,
                  },
                ],
              },
            ],
          },
          ...(enableRoles
            ? [
                {
                  name: 'add-roles',
                  nextStep: 'add-users',
                  title: intl.formatMessage(messages.addRoles),
                  fields: [
                    {
                      component: 'set-roles',
                      name: 'roles-list',
                    },
                  ],
                },
              ]
            : []),
          {
            name: 'add-users',
            nextStep: enableServiceAccounts ? 'add-service-accounts' : 'review',
            title: intl.formatMessage(messages.addMembers),
            fields: [
              {
                component: 'set-users',
                name: 'users-list',
              },
            ],
          },
          ...(enableServiceAccounts
            ? [
                {
                  name: 'add-service-accounts',
                  nextStep: 'review',
                  title: intl.formatMessage(messages.addServiceAccounts),
                  fields: [
                    {
                      component: 'set-service-accounts',
                      name: 'service-accounts-list',
                    },
                  ],
                },
              ]
            : []),
          {
            name: 'review',
            title: intl.formatMessage(messages.reviewDetails),
            // eslint-disable-next-line react/display-name
            buttons: (props) => <ReviewStepButtons {...props} context={AddGroupWizardContext} />,
            StepTemplate: ReviewTemplate,
            fields: [
              {
                component: 'summary-content',
                name: 'summary-content',
              },
            ],
          },
        ],
      },
    ],
  };
};
