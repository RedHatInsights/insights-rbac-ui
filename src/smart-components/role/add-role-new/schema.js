import AddPermissionTemplate from './add-permissions-template';
import ReviewTemplate from './review-template';
import { debouncedAsyncValidator, ValidatorReset } from './validators';

export default (container) => ({
  fields: [
    {
      component: 'wizard',
      name: 'wizzard',
      isDynamic: true,
      inModal: true,
      showTitles: true,
      title: 'Create role',
      container,
      fields: [
        {
          title: 'Create role',
          name: 'step-1',
          nextStep: {
            when: 'role-type',
            stepMapper: {
              copy: 'name-and-description',
              create: 'add-permissions',
            },
          },
          fields: [
            {
              component: 'radio',
              name: 'role-type',
              isRequired: true,
              options: [
                {
                  label: 'Create a role from scratch',
                  value: 'create',
                },
                {
                  label: 'Copy an existing role',
                  value: 'copy',
                },
              ],
              validate: [
                {
                  type: 'required',
                },
              ],
            },
            {
              component: 'text-field',
              name: 'role-name',
              type: 'text',
              label: 'Role name',
              isRequired: true,
              condition: {
                when: 'role-type',
                is: 'create',
              },
              validate: [
                debouncedAsyncValidator,
                {
                  type: 'required',
                },
              ],
            },
            {
              component: 'text-field',
              name: 'role-description',
              type: 'text',
              label: 'Role description',
              condition: {
                when: 'role-type',
                is: 'create',
              },
            },
            {
              component: 'base-role-table',
              name: 'copy-base-role',
              label: 'Base role',
              isRequired: true,
              condition: {
                when: 'role-type',
                is: 'copy',
              },
              validate: [
                {
                  type: 'required',
                },
              ],
            },
            {
              condition: {
                when: 'role-type',
                is: 'create',
              },
              component: 'description',
              name: 'fixasyncvalidation',
              Content: ValidatorReset,
            },
            {
              condition: {
                when: 'role-type',
                is: 'copy',
              },
              component: 'description',
              name: 'fixasyncvalidation2',
              Content: ValidatorReset,
            },
          ],
        },
        {
          title: 'Name and description',
          name: 'name-and-description',
          nextStep: 'add-permissions',
          fields: [
            {
              component: 'text-field',
              name: 'role-copy-name',
              type: 'text',
              label: 'Role name',
              isRequired: true,
              validate: [
                debouncedAsyncValidator,
                {
                  type: 'required',
                },
              ],
            },
            {
              component: 'text-field',
              name: 'role-copy-description',
              type: 'text',
              label: 'Role description',
            },
          ],
        },
        {
          name: 'add-permissions',
          title: 'Add permissions',
          StepTemplate: AddPermissionTemplate,
          nextStep: 'review',
          fields: [
            {
              component: 'add-permissions-table',
              name: 'add-permissions-table',
            },
          ],
        },
        {
          name: 'review',
          title: 'Review details',
          StepTemplate: ReviewTemplate,
          fields: [
            {
              component: 'review',
              name: 'review',
            },
          ],
        },
      ],
    },
  ],
});
