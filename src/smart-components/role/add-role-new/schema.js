/* eslint-disable react/display-name */
import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import AddPermissionTemplate from './add-permissions-template';
import ReviewTemplate from './review-template';
import CostResourcesTemplate from './cost-resources-template';
import { debouncedAsyncValidator, ValidatorReset } from './validators';
import ReviewStepButtons from '../../common/review-step-buttons';
import { AddRoleWizardContext } from './add-role-wizard';
import { locale } from '../../../AppEntry';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';

export const schemaBuilder = (container) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        inModal: true,
        showTitles: true,
        crossroads: ['role-type'],
        title: intl.formatMessage(messages.createRole),
        style: { overflow: 'hidden' },
        container,
        fields: [
          {
            title: intl.formatMessage(messages.createRole),
            name: 'step-1',
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
                component: 'text-field',
                name: 'role-name',
                type: 'text',
                label: intl.formatMessage(messages.roleName),
                isRequired: true,
                condition: {
                  when: 'role-type',
                  is: 'create',
                },
                validate: [
                  debouncedAsyncValidator,
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
                name: 'role-description',
                type: 'text',
                label: intl.formatMessage(messages.roleDescription),
                condition: {
                  when: 'role-type',
                  is: 'create',
                },
                validate: [
                  {
                    type: 'max-length',
                    threshold: 150,
                  },
                ],
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
            nextStep: 'add-permissions',
            fields: [
              {
                component: 'text-field',
                name: 'role-copy-name',
                type: 'text',
                label: intl.formatMessage(messages.roleName),
                isRequired: true,
                validate: [
                  debouncedAsyncValidator,
                  {
                    type: validatorTypes.REQUIRED,
                  },
                  {
                    type: 'max-length',
                    threshold: 150,
                  },
                ],
              },
              {
                component: 'text-field',
                name: 'role-copy-description',
                type: 'text',
                label: intl.formatMessage(messages.roleDescription),
                validate: [
                  {
                    type: 'max-length',
                    threshold: 150,
                  },
                ],
              },
            ],
          },
          {
            name: 'add-permissions',
            title: intl.formatMessage(messages.addPermissions),
            StepTemplate: AddPermissionTemplate,
            nextStep: ({ values }) =>
              values &&
              values['add-permissions-table'] &&
              values['add-permissions-table'].some(({ uuid }) => uuid.split(':')[0].includes('cost-management'))
                ? 'cost-resources-definition'
                : 'review',
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
            nextStep: 'review',
            StepTemplate: CostResourcesTemplate,
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: <p className="pf-u-mb-md">{intl.formatMessage(messages.applyCostPermissionText)}</p>,
              },
              {
                component: 'cost-resources',
                name: 'cost-resources',
                validate: [
                  (value = []) =>
                    value.every((p) => p.resources.length > 0) ? undefined : 'You need to assign at least one resource to each permission.',
                ],
              },
            ],
          },
          {
            name: 'review',
            title: intl.formatMessage(messages.reviewDetails),
            buttons: (props) => <ReviewStepButtons {...props} context={AddRoleWizardContext} />,
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
