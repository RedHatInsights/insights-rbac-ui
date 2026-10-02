import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import ReviewTemplate from './review-template';
import ReviewStepButtons from '../../../../shared/components/review-step-buttons';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import { createIntl, createIntlCache } from 'react-intl';

import providerMessages from '../../../../locales/translations.json';
import { locale } from '../../../../locales/locale';
import { AddGroupWizardContext } from './add-group-wizard-context';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import { commonMessages } from '../../../../shared/messages/common';

export const schemaBuilder = (enableServiceAccounts, enableRoles) => {
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
        title: intl.formatMessage({ id: 'createGroup', defaultMessage: 'Create group', description: 'Create group wizard title' }),
        'data-ouia-component-id': 'add-group-wizard',
        container: getModalContainer(),
        fields: [
          {
            name: 'name-and-description',
            buttons: WizardButtons,
            nextStep: enableRoles ? 'add-roles' : 'add-users',
            title: intl.formatMessage({
              id: 'nameAndDescription',
              defaultMessage: 'Name and description',
              description: 'Name and description wizard step title',
            }),
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
                  buttons: WizardButtons,
                  nextStep: 'add-users',
                  title: intl.formatMessage({ id: 'addRoles', defaultMessage: 'Add roles', description: 'Add roles wizard step title' }),
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
            buttons: WizardButtons,
            nextStep: enableServiceAccounts ? 'add-service-accounts' : 'review',
            title: intl.formatMessage({ id: 'addMembers', defaultMessage: 'Add members', description: 'Add members wizard step title' }),
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
                  buttons: WizardButtons,
                  nextStep: 'review',
                  title: intl.formatMessage({
                    id: 'addServiceAccounts',
                    defaultMessage: 'Add service accounts',
                    description: 'Add service accounts wizard step title',
                  }),
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
            title: intl.formatMessage(commonMessages.reviewDetails),
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
