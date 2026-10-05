import type { IntlShape } from 'react-intl';
import messages from '../../../../Messages';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import { getModalContainer } from '../../../../shared/helpers/modal-container';

export interface GrantAccessFormValues {
  // Add form fields here when needed
}

export const schemaBuilder = (intl: IntlShape, workspaceName: string, workspaceId?: string, resourceType?: 'workspace' | 'tenant') => {
  const requireNonEmptyArray = (message: string) => (value: unknown) => (!Array.isArray(value) || value.length === 0 ? message : undefined);

  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        'data-ouia-component-id': 'grant-access-wizard',
        inModal: true,
        showTitles: false,
        disableForwardJumping: true,
        container: getModalContainer(),
        title:
          resourceType === 'tenant'
            ? workspaceName
              ? intl.formatMessage(messages.grantAccessInOrganizationWithName, { organizationName: workspaceName })
              : intl.formatMessage(messages.grantAccessInOrganization)
            : intl.formatMessage(messages.grantAccessInWorkspace, { workspaceName }),
        fields: [
          {
            title: intl.formatMessage(messages.selectUserGroups),
            name: 'select-user-groups',
            buttons: WizardButtons,
            nextStep: 'select-roles',
            fields: [
              {
                name: 'selected-user-groups',
                component: 'user-groups-selection',
                isRequired: true,
                validate: [requireNonEmptyArray(intl.formatMessage(messages.selectAtLeastOneUserGroup))],
              },
            ],
          },
          {
            title: intl.formatMessage(messages.selectRoles),
            name: 'select-roles',
            buttons: WizardButtons,
            nextStep: 'review',
            fields: [
              {
                name: 'selected-roles',
                component: 'roles-selection',
                isRequired: true,
                validate: [requireNonEmptyArray(intl.formatMessage(messages.selectAtLeastOneRole))],
                workspaceId,
                resourceType,
              },
            ],
          },
          {
            title: intl.formatMessage(messages.review),
            name: 'review',
            buttons: WizardButtons,
            fields: [
              {
                name: 'review-selection',
                component: 'review-selection',
                workspaceId,
                resourceType,
              },
            ],
          },
        ],
      },
    ],
  };
};
