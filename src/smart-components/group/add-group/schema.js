import React from 'react';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import ReviewTemplate from './review-template';
import ReviewStepButtons from '../../common/review-step-buttons';
import { AddGroupWizardContext } from './add-group-wizard';

export default {
  fields: [
    {
      component: 'wizard',
      name: 'wizard',
      isDynamic: true,
      inModal: true,
      showTitles: true,
      title: 'Create group',
      fields: [
        {
          name: 'name-and-description',
          nextStep: 'add-roles',
          title: 'Name and Description',
          fields: [
            {
              component: 'set-name',
              name: 'group-name',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                },
              ],
            },
            {
              component: componentTypes.TEXTAREA,
              name: 'group-description',
              hideField: true,
              validate: [
                {
                  type: validatorTypes.MAX_LENGTH,
                  threshold: 150,
                },
              ],
            },
          ],
        },
        {
          name: 'add-roles',
          nextStep: 'add-users',
          title: 'Add roles',
          fields: [
            {
              component: 'set-roles',
              name: 'roles-list',
            },
          ],
        },
        {
          name: 'add-users',
          nextStep: 'review',
          title: 'Add members',
          fields: [
            {
              component: 'set-users',
              name: 'users-list',
            },
          ],
        },
        {
          name: 'review',
          title: 'Review details',
          // eslint-disable-next-line react/display-name
          buttons: (props) => <ReviewStepButtons {...props} context={AddGroupWizardContext} />,
          StepTemplate: ReviewTemplate,
          fields: [
            {
              component: 'summary-content',
              name: 'summary-content',
            },
          ],
        },
      ],
    },
  ],
};
