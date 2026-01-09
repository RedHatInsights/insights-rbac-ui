import { createIntl, createIntlCache } from 'react-intl';
import { locale } from '../../../locales/locale';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import WizardButtons from '../../../components/wizard/WizardButtons';
import { getModalContainer } from '../../../helpers/modal-container';

export interface GrantAccessFormValues {
  // Add form fields here when needed
}

export const schemaBuilder = (workspaceName: string) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        'data-ouia-component-id': 'grant-access-wizard',
        inModal: true,
        showTitles: true,
        disableForwardJumping: true,
        container: getModalContainer(),
        title: intl.formatMessage(messages.grantAccessInWorkspace, { workspaceName }),
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
              },
            ],
          },
        ],
      },
    ],
  };
};
