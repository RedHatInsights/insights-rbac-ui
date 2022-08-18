import React from 'react';
import AddPermissionTemplate from '../add-role-new/add-permissions-template';
import ReviewTemplate from './review-template';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

export const schemaBuilder = (container) => {
  const intl = useIntl();
  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        inModal: true,
        showTitles: true,
        crossroads: ['role-type'],
        title: intl.formatMessage(messages.addPermissions),
        container,
        fields: [
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
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: <p>{intl.formatMessage(messages.applyCostPermissionText)}</p>,
              },
              {
                component: 'cost-resources',
                name: 'cost-resources',
                validate: [
                  (value = []) => (value.every((p) => p.resources.length > 0) ? undefined : intl.formatMessage(messages.assignAtLeastOneResource)),
                ],
              },
            ],
          },
          {
            name: 'review',
            title: intl.formatMessage(messages.reviewDetails),
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
