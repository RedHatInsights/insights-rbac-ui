import { createIntl, createIntlCache } from 'react-intl';
import { locale } from '../../../../locales/locale';

import providerMessages from '../../../../locales/translations.json';
import WizardButtons from '../../../../shared/components/wizard/WizardButtons';
import { getModalContainer } from '../../../../shared/helpers/modal-container';

export interface GrantAccessFormValues {
  // Add form fields here when needed
}

export const schemaBuilder = (workspaceName: string, workspaceId?: string, resourceType?: 'workspace' | 'tenant') => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);

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
              ? intl.formatMessage(
                  {
                    id: 'grantAccessInOrganizationWithName',
                    defaultMessage: 'Grant access in {organizationName}',
                    description: 'Grant access in organization wizard title with organization name',
                  },
                  { organizationName: workspaceName },
                )
              : intl.formatMessage({
                  id: 'grantAccessInOrganization',
                  defaultMessage: 'Grant organization-wide access',
                  description: 'Grant access in organization wizard title',
                })
            : intl.formatMessage(
                {
                  id: 'grantAccessInWorkspace',
                  defaultMessage: 'Grant access in Workspace {workspaceName}',
                  description: 'Grant access in workspace wizard title',
                },
                { workspaceName },
              ),
        fields: [
          {
            title: intl.formatMessage({
              id: 'selectUserGroups',
              defaultMessage: 'Select user group(s)',
              description: 'Select user groups step title',
            }),
            name: 'select-user-groups',
            buttons: WizardButtons,
            nextStep: 'select-roles',
            fields: [
              {
                name: 'selected-user-groups',
                component: 'user-groups-selection',
                isRequired: true,
                validate: [
                  requireNonEmptyArray(
                    intl.formatMessage({
                      id: 'selectAtLeastOneUserGroup',
                      defaultMessage: 'Select at least one user group',
                      description: 'Validation message for user group selection',
                    }),
                  ),
                ],
              },
            ],
          },
          {
            title: intl.formatMessage({ id: 'selectRoles', defaultMessage: 'Select role(s)', description: 'Select roles step title' }),
            name: 'select-roles',
            buttons: WizardButtons,
            nextStep: 'review',
            fields: [
              {
                name: 'selected-roles',
                component: 'roles-selection',
                isRequired: true,
                validate: [
                  requireNonEmptyArray(
                    intl.formatMessage({
                      id: 'selectAtLeastOneRole',
                      defaultMessage: 'Select at least one role',
                      description: 'Validation message for role selection',
                    }),
                  ),
                ],
                workspaceId,
                resourceType,
              },
            ],
          },
          {
            title: intl.formatMessage({ id: 'review', defaultMessage: 'Review', description: 'Review label' }),
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
