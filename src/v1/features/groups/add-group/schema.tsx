import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import type { Schema } from '@data-driven-forms/react-form-renderer/common-types/schema';
import ReviewTemplate from './review-template';
import ReviewStepButtons from '../../../../shared/components/review-step-buttons';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import type { IntlShape } from 'react-intl';
import messages from '../../../../Messages';
import { AddGroupWizardContext } from './add-group-wizard-context';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import { pf4Components } from '../../../../shared/forms/pf4Components';
import { SetName } from './components/stepName/SetName';
import { SetRoles } from './components/stepRoles/SetRoles';
import { SetUsers } from './components/stepUsers/SetUsers';
import SetServiceAccounts from './components/stepServiceAccounts/SetServiceAccounts';
import { SummaryContent } from './components/stepReview/SummaryContent';
import { AddGroupSuccess } from './AddGroupSuccess';

/**
 * Component mapper for the Add Group wizard. Assembled with literal keys so
 * `AddGroupWizardSchema` can validate every `component:` value the schema uses.
 * `add-group-success` is injected dynamically by the wizard after submission,
 * so it has no static schema reference.
 */
export const wizardMapper = {
  ...pf4Components,
  'set-name': SetName,
  'set-roles': SetRoles,
  'set-users': SetUsers,
  'set-service-accounts': SetServiceAccounts,
  'summary-content': SummaryContent,
  'add-group-success': AddGroupSuccess,
};

export type AddGroupWizardSchema = Schema<typeof wizardMapper>;

export const schemaBuilder = (intl: IntlShape, enableServiceAccounts: boolean, enableRoles: boolean): AddGroupWizardSchema => {
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
        container: getModalContainer(),
        fields: [
          {
            name: 'name-and-description',
            buttons: WizardButtons,
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
                  buttons: WizardButtons,
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
            buttons: WizardButtons,
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
                  buttons: WizardButtons,
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
            buttons: (props: Omit<React.ComponentProps<typeof ReviewStepButtons>, 'context'>) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ReviewStepButtons {...props} context={AddGroupWizardContext as any} />
            ),
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
