import { componentTypes } from '@data-driven-forms/react-form-renderer';
import type { Schema } from '@data-driven-forms/react-form-renderer/common-types/schema';
import { IntlShape } from 'react-intl';
import WizardButtons from '../../../shared/components/wizard/WizardButtons';
import { getModalContainer } from '../../../shared/helpers/modal-container';
import messages from '../../../Messages';
import { pf4Components } from '../../../shared/forms/pf4Components';
import { IntroductionStep } from './components/IntroductionStep';
import { PostConversionRequirementsStep } from './components/PostConversionRequirementsStep';
import { PreConversionChecklistStep } from './components/PreConversionChecklistStep';
import { ConfirmConversionStep } from './components/ConfirmConversionStep';

/**
 * Component mapper for the conversion wizard. Assembled with literal keys so
 * `ConversionWizardSchema` can validate every `component:` value the schema uses.
 */
export const wizardMapper = {
  ...pf4Components,
  IntroductionStep,
  PostConversionRequirementsStep,
  PreConversionChecklistStep,
  ConfirmConversionStep,
};

export type ConversionWizardSchema = Schema<typeof wizardMapper>;

export const schemaBuilder = (intl: IntlShape): ConversionWizardSchema => {
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
                label: intl.formatMessage(messages.conversionWizardChecklistReviewedConfig),
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
                label: intl.formatMessage(messages.conversionWizardChecklistUnderstandPermanent),
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
                label: intl.formatMessage(messages.conversionWizardChecklistCompletePostConversion),
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
                label: intl.formatMessage(messages.conversionWizardChecklistUnderstandRemediation),
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
                label: intl.formatMessage(messages.conversionWizardConfirmCheckbox),
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
