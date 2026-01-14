import PageHeader from '@patternfly/react-component-groups/dist/esm/PageHeader';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';

import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import { useParams } from 'react-router-dom';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { EditRolePermissions } from './EditRolePermissions';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { useRoleQuery, useUpdateRoleMutation } from '../../../data/queries/roles';
import type { Access as AccessType, RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

interface FormValues {
  name: string;
  description?: string;
  'role-permissions': string[];
}

export const EditRole: FunctionComponent = () => {
  const intl = useIntl();
  const { roleId } = useParams();
  const navigate = useAppNavigate();
  const pageTitle = intl.formatMessage(Messages.edit);
  const [initialFormData, setInitialFormData] = useState<RoleWithAccess | null>(null);

  // Use TanStack Query for role data
  const { data: selectedRole, isLoading: isRoleLoading } = useRoleQuery(roleId ?? '');
  const updateRoleMutation = useUpdateRoleMutation();

  const navigateToRoles = () => {
    navigate(pathnames['roles'].link, { replace: true });
  };

  const handleSubmit = async (values: FormValues) => {
    if (!roleId || !initialFormData) return;

    const initialPermissions = initialFormData.access?.map((access: AccessType) => access.permission) ?? [];
    if (
      values.name !== initialFormData?.name ||
      values.description !== initialFormData?.description ||
      JSON.stringify(values['role-permissions']) !== JSON.stringify(initialPermissions)
    ) {
      await updateRoleMutation.mutateAsync({
        uuid: roleId,
        rolePut: {
          name: values.name,
          display_name: values.name,
          description: values.description || undefined,
          access: values['role-permissions'].map((permission: string) => ({
            permission,
            resourceDefinitions: [],
          })),
        },
      });
      // Success notification handled by mutation
      navigateToRoles();
    } else {
      navigateToRoles();
    }
  };

  // Set initial form data once role is loaded
  useEffect(() => {
    if (selectedRole && !initialFormData) {
      setInitialFormData(selectedRole);
    }
  }, [selectedRole, initialFormData]);

  const isLoading = isRoleLoading || !initialFormData;

  const schema = useMemo(
    () => ({
      fields: [
        {
          name: 'name',
          label: intl.formatMessage(Messages.name),
          component: componentTypes.TEXT_FIELD,
          validate: [
            { type: validatorTypes.REQUIRED },
            (value: string) => {
              if (value === initialFormData?.name) {
                return undefined;
              }
            },
          ],
          initialValue: initialFormData?.name,
          isRequired: true,
        },
        {
          name: 'description',
          label: intl.formatMessage(Messages.description),
          component: componentTypes.TEXTAREA,
          initialValue: initialFormData?.description,
        },
        {
          name: 'role-permissions',
          component: 'role-permissions',
          roleId: roleId,
          initialValue: initialFormData?.access?.map((access: AccessType) => access.permission) ?? [],
        },
      ],
    }),
    [initialFormData, roleId, intl],
  );

  return (
    <React.Fragment>
      <PageHeader data-codemods title={`${pageTitle} ${selectedRole?.display_name || ''}`} />
      <PageSection hasBodyWrapper data-ouia-component-id="edit-role-form" className="pf-v6-u-m-lg-on-lg" isWidthLimited>
        {isLoading || !initialFormData ? (
          <div style={{ textAlign: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <FormRenderer
            schema={schema}
            componentMapper={{
              ...componentMapper,
              'role-permissions': EditRolePermissions,
            }}
            onSubmit={handleSubmit}
            onCancel={navigateToRoles}
            FormTemplate={FormTemplate}
            FormTemplateProps={{
              disableSubmit: ['pristine', 'invalid'],
              submitLabel: intl.formatMessage(Messages.saveChanges),
            }}
            debug={(values) => {
              console.log('values:', values);
            }}
          />
        )}
      </PageSection>
    </React.Fragment>
  );
};

export default EditRole;
