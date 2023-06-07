import React from 'react';
import AddPermissionTemplate from '../add-role/add-permissions-template';
import ReviewTemplate from './review-template';
import { locale } from '../../../AppEntry';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import { validateNextAddRolePermissionStep } from '../permission-wizard-helper';
import InventoryGroupsRoleTemplate from '../add-role/inventory-groups-role-template';

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
        title: intl.formatMessage(messages.addPermissions),
        container,
        fields: [
          {
            name: 'add-permissions',
            title: intl.formatMessage(messages.addPermissions),
            StepTemplate: AddPermissionTemplate,
            nextStep: ({ values }) => {
              return validateNextAddRolePermissionStep('add-permissions', values);
            },
            fields: [
              {
                component: 'add-permissions-table',
                name: 'add-permissions-table',
              },
            ],
          },
          {
            name: 'inventory-groups-role',
            title: intl.formatMessage(messages.inventoryGroupsAccessTitle),
            StepTemplate: InventoryGroupsRoleTemplate,
            nextStep: ({ values }) => {
              return validateNextAddRolePermissionStep('inventory-groups-role', values);
            },
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: <p>{intl.formatMessage(messages.inventoryGroupsAccessDescription)}</p>,
              },
              {
                component: 'inventory-groups-role',
                name: 'inventory-groups-role',
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
                  (value = []) =>
                    value.every(({ resources }) => resources && resources.length > 0)
                      ? undefined
                      : intl.formatMessage(messages.assignAtLeastOneResource),
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
