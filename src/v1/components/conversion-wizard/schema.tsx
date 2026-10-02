import { componentTypes } from '@data-driven-forms/react-form-renderer';
import { IntlShape } from 'react-intl';
import WizardButtons from '../../../shared/components/wizard/WizardButtons';
import { getModalContainer } from '../../../shared/helpers/modal-container';

export const schemaBuilder = (intl: IntlShape) => {
  return {
    fields: [
      {
        component: 'wizard',
        name: 'conversion-wizard',
        isDynamic: true,
        'data-ouia-component-id': 'conversion-wizard',
        inModal: true,
        showTitles: true,
        container: getModalContainer(),
        title: 'Convert to workspace-based access management',
        fields: [
          {
            title: 'Introduction',
            showTitle: false,
            name: 'introduction',
            buttons: WizardButtons,
            nextStep: 'post-conversion-requirements',
            fields: [
              {
                name: 'introduction-step',
                component: 'IntroductionStep',
              },
            ],
          },
          {
            title: 'Post-conversion requirements',
            showTitle: false,
            name: 'post-conversion-requirements',
            buttons: WizardButtons,
            nextStep: 'pre-conversion-checklist',
            fields: [
              {
                name: 'post-conversion-requirements-step',
                component: 'PostConversionRequirementsStep',
              },
            ],
          },
          {
            title: 'Pre-conversion checklist',
            showTitle: false,
            name: 'pre-conversion-checklist',
            buttons: WizardButtons,
            nextStep: 'confirm-conversion',
            fields: [
              {
                name: 'pre-conversion-checklist-step',
                component: 'PreConversionChecklistStep',
              },
              {
                name: 'checkbox-reviewed-config',
                component: componentTypes.CHECKBOX,
                label: intl.formatMessage({
                  id: 'conversionWizardChecklistReviewedConfig',
                  defaultMessage: 'I have reviewed the current user and group configuration and understand what will change',
                  description: 'Pre-conversion checklist item 1',
                }),
                validate: [
                  {
                    type: 'required-checkbox',
                  },
                ],
                validateOnMount: false,
              },
              {
                name: 'checkbox-understand-permanent',
                component: componentTypes.CHECKBOX,
                label: intl.formatMessage({
                  id: 'conversionWizardChecklistUnderstandPermanent',
                  defaultMessage: 'I understand that conversion is permanent and cannot be reversed',
                  description: 'Pre-conversion checklist item 2',
                }),
                validate: [
                  {
                    type: 'required-checkbox',
                  },
                ],
                validateOnMount: false,
              },
              {
                name: 'checkbox-complete-post-conversion',
                component: componentTypes.CHECKBOX,
                label: intl.formatMessage({
                  id: 'conversionWizardChecklistCompletePostConversion',
                  defaultMessage: 'I will complete post-conversion organization tasks within one week',
                  description: 'Pre-conversion checklist item 3',
                }),
                validate: [
                  {
                    type: 'required-checkbox',
                  },
                ],
                validateOnMount: false,
              },
              {
                name: 'checkbox-understand-remediation',
                component: componentTypes.CHECKBOX,
                label: intl.formatMessage({
                  id: 'conversionWizardChecklistUnderstandRemediation',
                  defaultMessage: 'I understand that all existing legacy remediation plans will be deleted',
                  description: 'Pre-conversion checklist item 4',
                }),
                validate: [
                  {
                    type: 'required-checkbox',
                  },
                ],
                validateOnMount: false,
              },
            ],
          },
          {
            title: 'Confirm conversion',
            showTitle: false,
            name: 'confirm-conversion',
            buttons: WizardButtons,
            fields: [
              {
                name: 'confirm-conversion-step',
                component: 'ConfirmConversionStep',
              },
              {
                name: 'checkbox-confirm-conversion',
                component: componentTypes.CHECKBOX,
                label: intl.formatMessage({
                  id: 'conversionWizardConfirmCheckbox',
                  defaultMessage: 'Yes, convert to workspace-based access management.',
                  description: 'Confirm conversion checkbox label',
                }),
                validate: [
                  {
                    type: 'required-checkbox',
                  },
                ],
                validateOnMount: false,
              },
            ],
          },
        ],
      },
    ],
  };
};
