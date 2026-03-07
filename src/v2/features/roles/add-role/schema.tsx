import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import AddPermissionTemplate from './AddPermissionTemplate';
import CreateRoleStepTemplate from './CreateRoleStepTemplate';
import ReviewTemplate from './ReviewTemplate';
import CostResourcesTemplate from './CostResourcesTemplate';
import { ValidatorReset } from './validators';
import ReviewStepButtons from '../../../../shared/components/review-step-buttons';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../../Messages';
import { locale } from '../../../../locales/locale';
import { AddRoleWizardContext } from './AddRoleWizardContext';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import providerMessages from '../../../../locales/data.json';

interface FormValues {
  'role-type'?: string;
  'add-permissions-table'?: { uuid: string }[];
  [key: string]: unknown;
}

const isCostPermission = (permissionId: string): boolean =>
  permissionId.split(':')[0].includes('cost-management') && !permissionId.includes('settings');

const validateNextAddRolePermissionStep = (currentStep: string, values: FormValues): string => {
  const permissions = (values && values['add-permissions-table']) ?? [];
  const hasCostPermissions = permissions.some(({ uuid }) => isCostPermission(uuid));

  if (currentStep === 'add-permissions' && hasCostPermissions) {
    return 'cost-resources-definition';
  }

  return 'review';
};

export const schemaBuilder = (_featureFlag: boolean) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale as keyof typeof providerMessages] }, cache);

  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        inModal: true,
        showTitles: true,
        crossroads: ['role-type'],
        'data-ouia-component-id': 'add-role-wizard',
        title: intl.formatMessage(messages.createRole),
        style: { overflow: 'hidden' },
        container: getModalContainer(),
        fields: [
          {
            title: intl.formatMessage(messages.createRole),
            name: 'step-1',
            StepTemplate: CreateRoleStepTemplate,
            buttons: WizardButtons,
            nextStep: {
              when: 'role-type',
              stepMapper: {
                copy: 'name-and-description',
                create: 'add-permissions',
              },
            },
            fields: [
              {
                component: 'type-selector',
                name: 'role-type',
                isRequired: true,
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                ],
              },
              {
                component: 'set-name',
                name: 'role-name',
                type: 'text',
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                  {
                    type: validatorTypes.MAX_LENGTH,
                    threshold: 150,
                  },
                ],
                condition: {
                  when: 'role-type',
                  is: 'create',
                },
              },
              {
                component: 'text-field',
                name: 'role-description',
                hideField: true,
              },
              {
                component: 'base-role-table',
                name: 'copy-base-role',
                label: intl.formatMessage(messages.baseRole),
                isRequired: true,
                condition: {
                  when: 'role-type',
                  is: 'copy',
                },
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                ],
              },
              {
                condition: {
                  when: 'role-type',
                  is: 'create',
                },
                component: 'description',
                name: 'fixasyncvalidation',
                Content: ValidatorReset,
              },
              {
                condition: {
                  when: 'role-type',
                  is: 'copy',
                },
                component: 'description',
                name: 'fixasyncvalidation2',
                Content: ValidatorReset,
              },
            ],
          },
          {
            title: intl.formatMessage(messages.nameAndDescription),
            name: 'name-and-description',
            buttons: WizardButtons,
            nextStep: 'add-permissions',
            fields: [
              {
                component: 'set-name',
                name: 'role-copy-name',
                nameFieldKey: 'role-copy-name',
                descriptionFieldKey: 'role-copy-description',
                type: 'text',
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                  {
                    type: validatorTypes.MAX_LENGTH,
                    threshold: 150,
                  },
                ],
              },
              {
                component: 'text-field',
                name: 'role-copy-description',
                hideField: true,
              },
            ],
          },
          {
            name: 'add-permissions',
            title: intl.formatMessage(messages.addPermissions),
            StepTemplate: AddPermissionTemplate,
            buttons: WizardButtons,
            nextStep: ({ values }: { values: FormValues }) => validateNextAddRolePermissionStep('add-permissions', values),
            fields: [
              {
                component: 'add-permissions-table',
                name: 'add-permissions-table',
              },
            ],
          },
          {
            name: 'cost-resources-definition',
            title: intl.formatMessage(messages.defineCostResources),
            buttons: WizardButtons,
            nextStep: 'review',
            StepTemplate: CostResourcesTemplate,
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: <p className="pf-v6-u-mb-md">{intl.formatMessage(messages.applyCostPermissionText)}</p>,
              },
              {
                component: 'cost-resources',
                name: 'cost-resources',
                validate: [
                  (value: { resources: unknown[] }[] = []) =>
                    value?.every(({ resources }) => resources?.length > 0) ? undefined : intl.formatMessage(messages.assignAtLeastOneResource),
                ],
              },
            ],
          },
          {
            name: 'review',
            title: intl.formatMessage(messages.reviewDetails),
            buttons: (props: Omit<React.ComponentProps<typeof ReviewStepButtons>, 'context'>) => (
              <ReviewStepButtons {...props} context={AddRoleWizardContext as React.ComponentProps<typeof ReviewStepButtons>['context']} />
            ),
            StepTemplate: ReviewTemplate,
            fields: [
              {
                component: 'review',
                name: 'review',
              },
            ],
          },
        ],
      },
    ],
  };
};
