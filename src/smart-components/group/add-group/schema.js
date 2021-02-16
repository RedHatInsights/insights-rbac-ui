import validatorTypes from '@data-driven-forms/react-form-renderer/dist/esm/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/esm/component-types';
import { debouncedAsyncValidator } from '../validators';

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
          title: 'Name and Description',
          nextStep: 'add-roles',
          fields: [
            {
              component: componentTypes.TEXT_FIELD,
              name: 'group-name',
              label: 'Group name',
              isRequired: true,
              validate: [
                debouncedAsyncValidator,
                {
                  type: validatorTypes.REQUIRED,
                },
              ],
            },
            {
              component: componentTypes.TEXTAREA,
              name: 'group-description',
              type: 'text',
              label: 'Group description',
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
