import React from 'react';
import AddPermissionTemplate from '../add-role/AddPermissionTemplate';
import ReviewTemplate from './ReviewTemplate';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import { createIntl, createIntlCache, defineMessages } from 'react-intl';

import providerMessages from '../../../../locales/translations.json';
import { validateNextAddRolePermissionStep } from '../permissionWizardHelper';
import InventoryGroupsRoleTemplate from '../add-role/InventoryGroupsRoleTemplate';
import { locale } from '../../../../locales/locale';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import { commonMessages } from '../../../../shared/messages/common';

const messages = defineMessages({
  workspacesAccessTitle: {
    id: 'workspacesAccessTitle',
    defaultMessage: 'Define Workspaces access',
    description: 'Step for adding correct workspaces permissions to role.',
  },
  inventoryGroupsAccessTitle: {
    id: 'inventoryGroupsAccessTitle',
    defaultMessage: 'Define Inventory group access',
    description: 'Step for adding correct group permissions to role.',
  },
  workspacesAccessDescription: {
    id: 'workspacesAccessDescription',
    defaultMessage: "Specify which workspaces you'd like to apply your selected permissions to, using the dropdowns below.",
    description: 'Instructions for the role wizard access step',
  },
  inventoryGroupsAccessDescription: {
    id: 'inventoryGroupsAccessDescription',
    defaultMessage: "Specify which inventory group(s) you'd like to apply your selected permissions to, using the dropdowns below.",
    description: 'Instructions for the role wizard access step',
  },
});

interface FormValues {
  'add-permissions-table'?: { uuid: string }[];
  [key: string]: unknown;
}

export const schemaBuilder = (featureFlag: boolean) => {
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
        title: intl.formatMessage(commonMessages.addPermissions),
        container: getModalContainer(),
        fields: [
          {
            name: 'add-permissions',
            title: intl.formatMessage(commonMessages.addPermissions),
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
            name: 'inventory-groups-role',
            title: intl.formatMessage(featureFlag ? messages.workspacesAccessTitle : messages.inventoryGroupsAccessTitle),
            StepTemplate: InventoryGroupsRoleTemplate,
            buttons: WizardButtons,
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
                      : intl.formatMessage({
                          id: 'assignAtLeastOneGroup',
                          defaultMessage: 'You need to assign at least one inventory group to each permission.',
                          description: 'Assign at least one inventory group message',
                        }),
                ],
              },
            ],
          },
          {
            name: 'cost-resources-definition',
            title: intl.formatMessage(commonMessages.defineCostResources),
            buttons: WizardButtons,
            nextStep: 'review',
            fields: [
              {
                component: 'plain-text',
                name: 'text-description',
                label: (
                  <p>
                    {intl.formatMessage({
                      id: 'applyCostPermissionText',
                      defaultMessage:
                        'Specify where you would like to apply each cost permission selected in the previous step, using the dropdown below.',
                      description: 'Apply Cost permission text',
                    })}
                  </p>
                ),
              },
              {
                component: 'cost-resources',
                name: 'cost-resources',
              },
            ],
          },
          {
            name: 'review',
            title: intl.formatMessage(commonMessages.reviewDetails),
            StepTemplate: ReviewTemplate,
            buttons: WizardButtons,
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
