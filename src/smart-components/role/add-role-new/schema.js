import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import AddPermissionTemplate from './add-permissions-template';
import ReviewTemplate from './review-template';
import CostResourcesTemplate from './cost-resources-template';
import { debouncedAsyncValidator, ValidatorReset } from './validators';
import ReviewStepButtons from '../../common/review-step-buttons';
import { AddRoleWizardContext } from './add-role-wizard';

export default (container) => ({
  fields: [
    {
      component: 'wizard',
      name: 'wizard',
      isDynamic: true,
      inModal: true,
      showTitles: true,
      crossroads: ['role-type'],
      title: 'Create role',
      container,
      fields: [
        {
          title: 'Create role',
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
              label: 'Role name',
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
              label: 'Role description',
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
              label: 'Base role',
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
          title: 'Name and description',
          name: 'name-and-description',
          nextStep: 'add-permissions',
          fields: [
            {
              component: 'text-field',
              name: 'role-copy-name',
              type: 'text',
              label: 'Role name',
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
              label: 'Role description',
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
          title: 'Add permissions',
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
          title: 'Define Cost Management resources',
          nextStep: 'review',
          StepTemplate: CostResourcesTemplate,
          fields: [
            {
              component: 'plain-text',
              name: 'text-description',
              label: <p>Specify where you would like to apply each cost permission selected in the previous step, using the dropdown below.</p>,
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
          title: 'Review details',
          // eslint-disable-next-line react/display-name
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
});
