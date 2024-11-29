import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { locale } from '../../../AppEntry';
import { createIntl, createIntlCache } from 'react-intl';
import { componentTypes } from '@data-driven-forms/react-form-renderer';
import providerMessages from '../../../locales/data.json';
import messages from '../../../Messages';

// hardcoded for now
export const BUNDLES = [
  {
    label: 'OpenShift',
    value: 'openshift',
  },
  {
    label: 'RHEL',
    value: 'rhel',
  },
  {
    label: 'Ansible Lightspeed',
    value: 'lightspeed',
  },
];

export const WORKSPACE_NAME = 'workspace-name';
export const WORKSPACE_DESCRIPTION = 'workspace-description';
export const WORKSPACE_FEATURES = 'workspace-features';
export const WORKSPACE_PARENT = 'workspace-parent';
export const WORKSPACE_ACCOUNT = 'workspace-account';

export interface CreateWorkspaceFormValues {
  [WORKSPACE_NAME]: string;
  [WORKSPACE_DESCRIPTION]: string;
  [WORKSPACE_FEATURES]: string[];
  [WORKSPACE_PARENT]: string;
  [WORKSPACE_ACCOUNT]: string;
}

export const schemaBuilder = (enableFeatures: boolean) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    fields: [
      {
        component: 'wizard',
        name: 'wizard',
        isDynamic: true,
        crossroads: ['workspace-features'],
        'data-ouia-component-id': 'create-workspace-wizard',
        inModal: true,
        showTitles: true,
        title: intl.formatMessage(messages.createNewWorkspace),
        fields: [
          {
            title: intl.formatMessage(messages.workspaceDetails),
            name: 'details',
            nextStep: () => (enableFeatures ? 'select-features' : 'review'),
            fields: [
              {
                name: 'details-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v5-u-my-md',
                label:
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
              },
              {
                name: 'workspace-name',
                component: componentTypes.TEXT_FIELD,
                label: intl.formatMessage(messages.workspaceName),
                isRequired: true,
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                  {
                    type: validatorTypes.MAX_LENGTH,
                    threshold: 150,
                  },
                ],
              },
              {
                name: 'workspace-details',
                component: 'SetDetails',
                hideField: !enableFeatures,
                fields: [
                  {
                    name: WORKSPACE_PARENT,
                    component: componentTypes.TEXT_FIELD,
                    isRequired: true,
                    hideField: true,
                    validate: [
                      {
                        type: validatorTypes.REQUIRED,
                      },
                    ],
                  },
                  {
                    name: WORKSPACE_ACCOUNT,
                    component: componentTypes.TEXT_FIELD,
                    isRequired: true,
                    hideField: true,
                    validate: [
                      {
                        type: validatorTypes.REQUIRED,
                      },
                    ],
                  },
                ],
              },
              {
                name: 'workspace-description',
                component: componentTypes.TEXTAREA,
                label: intl.formatMessage(messages.workspaceDescription),
              },
            ],
          },
          {
            title: intl.formatMessage(messages.selectFeatures),
            name: 'select-features',
            nextStep: ({ values }: { values: CreateWorkspaceFormValues }) => {
              const selectedFeatures = values['workspace-features'] || [];
              return selectedFeatures.length > 0 ? `ear-mark-${selectedFeatures[0]}` : 'review';
            },
            fields: [
              {
                name: 'features-description',
                className: 'pf-v5-u-my-md',
                component: componentTypes.PLAIN_TEXT,
                label:
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
              },
              {
                name: 'workspace-features',
                className: 'pf-v5-u-my-sm',
                component: componentTypes.CHECKBOX,
                options: BUNDLES,
              },
            ],
          },
          ...BUNDLES.map((feature) => ({
            name: `ear-mark-${feature.value}`,
            title: feature.label,
            showTitle: false,
            substepOf: intl.formatMessage(messages.earMark),
            nextStep: ({ values }: { values: CreateWorkspaceFormValues }) => {
              const currIndex = values['workspace-features'].indexOf(feature.value);
              return currIndex < values['workspace-features'].length - 1 ? `ear-mark-${values['workspace-features'][currIndex + 1]}` : 'review';
            },
            fields: [
              {
                component: 'SetEarMark',
                name: `ear-mark-${feature.value}-cores`,
                feature,
                isRequired: true,
              },
            ],
          })),
          {
            name: 'review',
            title: intl.formatMessage(messages.review),
            showTitle: false,
            fields: [
              {
                component: 'Review',
                name: 'review',
              },
            ],
          },
        ],
      },
    ],
  };
};
