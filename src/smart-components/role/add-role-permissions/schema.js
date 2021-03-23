import React from 'react';
import AddPermissionTemplate from '../add-role-new/add-permissions-template';
import ReviewTemplate from './review-template';

export const schemaBuilder = (container) => ({
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
