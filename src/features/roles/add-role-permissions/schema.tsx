import React from 'react';
import AddPermissionTemplate from '../add-role/AddPermissionTemplate';
import ReviewTemplate from './ReviewTemplate';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import { validateNextAddRolePermissionStep } from '../permissionWizardHelper';
import InventoryGroupsRoleTemplate from '../add-role/InventoryGroupsRoleTemplate';
import { locale } from '../../../locales/locale';

interface FormValues {
  'add-permissions-table'?: { uuid: string }[];
  [key: string]: unknown;
}

export const schemaBuilder = (container: HTMLElement, featureFlag: boolean) => {
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
        title: intl.formatMessage(messages.addPermissions),
        container,
        fields: [
          {
            name: 'add-permissions',
            title: intl.formatMessage(messages.addPermissions),
            StepTemplate: AddPermissionTemplate,
            nextStep: ({ values }: { values: FormValues }) => validateNextAddRolePermissionStep('add-permissions', values),
            fields: [
              {
                component: 'add-permissions-table',
                name: 'add-permissions-table',
              },
            ],
          },
          {
            name: 'inventory-groups-role',
            title: intl.formatMessage(featureFlag ? messages.workspacesAccessTitle : messages.inventoryGroupsAccessTitle),
            StepTemplate: InventoryGroupsRoleTemplate,
            nextStep: ({ values }: { values: FormValues }) => validateNextAddRolePermissionStep('inventory-groups-role', values),
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: <p>{intl.formatMessage(featureFlag ? messages.workspacesAccessDescription : messages.inventoryGroupsAccessDescription)}</p>,
              },
              {
                component: 'inventory-groups-role',
                name: 'inventory-groups-role',
                validate: [
                  (value: { groups: unknown[]; permission: string }[] = []) =>
                    value?.every(({ groups, permission }) => groups?.length > 0 && permission)
                      ? undefined
                      : intl.formatMessage(messages.assignAtLeastOneInventoryGroup),
                ],
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
                  (value: { resources: unknown[] }[] = []) =>
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
