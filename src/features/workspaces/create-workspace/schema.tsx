import { componentTypes } from '@data-driven-forms/react-form-renderer';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React from 'react';
import { FormattedMessage, createIntl, createIntlCache } from 'react-intl';
import { useSelector } from 'react-redux';
import providerMessages from '../../../locales/data.json';
import { locale } from '../../../locales/locale';
import messages from '../../../Messages';
import InputHelpPopover from '../../../components/forms/InputHelpPopover';
import WizardButtons from '../../../components/wizard/WizardButtons';
import { getModalContainer } from '../../../helpers/modal-container';
import { Workspace, isWorkspace } from '../../../redux/workspaces/reducer';
import { selectWorkspaces } from '../../../redux/workspaces/selectors';

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
  [WORKSPACE_PARENT]: Workspace;
  [WORKSPACE_ACCOUNT]: string;
}

export const schemaBuilder = (enableBillingFeatures: boolean) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale as keyof typeof providerMessages] }, cache);
  const allWorkspaces = useSelector(selectWorkspaces);

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
        container: getModalContainer(),
        title: intl.formatMessage(messages.createNewWorkspace),
        fields: [
          {
            title: intl.formatMessage(messages.workspaceDetails),
            showTitle: false,
            name: 'details',
            buttons: WizardButtons,
            nextStep: () => (enableBillingFeatures ? 'select-features' : 'review'),
            fields: [
              {
                name: 'details-title',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-c-title pf-m-xl',
                label: intl.formatMessage(messages.workspaceDetailsTitle),
              },
              {
                name: 'details-description',
                component: componentTypes.PLAIN_TEXT,
                className: 'pf-v6-u-my-md',
                label: intl.formatMessage(messages.workspaceDetailsDescription),
              },
              {
                name: 'workspace-name',
                component: componentTypes.TEXT_FIELD,
                label: intl.formatMessage(messages.workspaceName),
                isRequired: true,
                FormGroupProps: {
                  labelIcon: (
                    <InputHelpPopover
                      bodyContent={
                        <Content component="p">
                          <FormattedMessage
                            id={messages.workspaceNamingGuidelines.id}
                            defaultMessage={messages.workspaceNamingGuidelines.defaultMessage}
                            values={{
                              link: '', // RHCLOUD-40659: Temporarily hidden link until Learn More section is ready
                              // link: (
                              //   <Button variant="link" href="#" isInline>
                              //     {intl.formatMessage(messages.learnMore)}
                              //   </Button>
                              // ),
                            }}
                          />
                        </Content>
                      }
                      field="workspace name"
                    />
                  ),
                },
                validate: [
                  {
                    type: validatorTypes.REQUIRED,
                  },
                  (value: string, currData: unknown | Workspace) => {
                    if (isWorkspace(currData)) {
                      const isDuplicate = allWorkspaces.some(
                        (existingWorkspace) => existingWorkspace.name.toLowerCase() === value?.toLowerCase() && existingWorkspace.id !== currData.id,
                      );
                      return isDuplicate ? intl.formatMessage(messages.workspaceNameTaken) : undefined;
                    }
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
                FormGroupProps: {
                  labelIcon: (
                    <InputHelpPopover
                      bodyContent={<Content component="p">{intl.formatMessage(messages.workspaceDescriptionMaxLength, { count: 255 })}</Content>}
                      field="workspace description"
                    />
                  ),
                },
                validate: [
                  {
                    type: validatorTypes.MAX_LENGTH,
                    threshold: 255,
                  },
                ],
              },
            ],
          },
          {
            title: intl.formatMessage(messages.selectFeatures),
            name: 'select-features',
            buttons: WizardButtons,
            nextStep: ({ values }: { values: CreateWorkspaceFormValues }) => {
              const selectedFeatures = values['workspace-features'] || [];
              return selectedFeatures.length > 0 ? `ear-mark-${selectedFeatures[0]}` : 'review';
            },
            fields: [
              {
                name: 'features-description',
                className: 'pf-v6-u-my-md',
                component: componentTypes.PLAIN_TEXT,
                label:
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
              },
              {
                name: 'workspace-features',
                className: 'pf-v6-u-my-sm',
                component: componentTypes.CHECKBOX,
                options: BUNDLES,
              },
            ],
          },
          ...BUNDLES.map((feature) => ({
            name: `ear-mark-${feature.value}`,
            title: feature.label,
            showTitle: false,
            buttons: WizardButtons,
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
            buttons: WizardButtons,
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
