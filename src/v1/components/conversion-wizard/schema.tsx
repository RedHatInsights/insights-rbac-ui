import { componentTypes } from '@data-driven-forms/react-form-renderer';
import WizardButtons from '../../../shared/components/wizard/WizardButtons';
import { getModalContainer } from '../../../shared/helpers/modal-container';

export const schemaBuilder = () => {

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
                name: 'introduction-title',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-c-title pf-m-xl',
                label: 'Introduction',
              },
              {
                name: 'introduction-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-u-my-md',
                label: 'Introduction step content placeholder',
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
                name: 'post-conversion-title',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-c-title pf-m-xl',
                label: 'Post-conversion requirements',
              },
              {
                name: 'post-conversion-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-u-my-md',
                label: 'Post-conversion requirements step content placeholder',
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
                name: 'pre-conversion-title',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-c-title pf-m-xl',
                label: 'Pre-conversion checklist',
              },
              {
                name: 'pre-conversion-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-u-my-md',
                label: 'Pre-conversion checklist step content placeholder',
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
                name: 'confirm-conversion-title',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-c-title pf-m-xl',
                label: 'Confirm conversion',
              },
              {
                name: 'confirm-conversion-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-u-my-md',
                label: 'Confirm conversion step content placeholder',
              },
            ],
          },
        ],
      },
    ],
  };
};
