import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSectionVariants } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchRole, updateRole } from '../../../redux/roles/actions';
import { selectSelectedRole } from '../../../redux/roles/selectors';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { EditRolePermissions } from './edit-role-permissions';
import useAppNavigate from '../../../hooks/useAppNavigate';

export const EditRole: FunctionComponent = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { roleId } = useParams();
  const navigate = useAppNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const pageTitle = intl.formatMessage(Messages.edit);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const selectedRole = useSelector(selectSelectedRole);

  const navigateToRoles = () => {
    if (roleId) {
      dispatch(fetchRole(roleId));
    }
    navigate(pathnames['roles'].link, { replace: true });
  };

  const handleSubmit = async (values: any) => {
    if (!roleId) return;

    const initialPermissions = initialFormData?.access.map((access: any) => access.permission);
    if (
      values.name !== initialFormData?.name ||
      values.description !== initialFormData?.description ||
      values['role-permissions'] !== initialPermissions
    ) {
      await Promise.all([
        dispatch(
          updateRole(
            roleId,
            {
              name: values.name,
              display_name: values.name,
              description: values.description || null,
              access: values['role-permissions'].map((permission: string) => ({
                permission,
                resourceDefinitions: [],
              })),
            },
            false,
          ),
        ),
      ]);
      await Promise.all([roleId ? dispatch(fetchRole(roleId)) : Promise.resolve()]);
      navigateToRoles();
    } else {
      navigateToRoles();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([roleId ? dispatch(fetchRole(roleId)) : Promise.resolve()]);
      } finally {
        if (selectedRole) {
          setInitialFormData(selectedRole);
          setIsLoading(false);
        }
      }
    };
    if (roleId && isLoading) {
      fetchData();
    }
  }, [dispatch, roleId, selectedRole?.uuid]);

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
          initialValue: initialFormData?.access.map((access: any) => access.permission),
        },
      ],
    }),
    [initialFormData, roleId, intl],
  );

  return (
    <React.Fragment>
      <ContentHeader title={`${pageTitle} ${selectedRole?.display_name || ''}`} />
      <PageSection data-ouia-component-id="edit-role-form" className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
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
