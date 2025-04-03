import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';
import RbacBreadcrumbs from '../../../presentational-components/shared/breadcrumbs';
import { mergeToBasename } from '../../../presentational-components/shared/AppLink';
import pathnames from '../../../utilities/pathnames';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchRole } from '../../../redux/actions/role-actions';
import { RBACStore } from '../../../redux/store';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { EditRolePermissions } from './edit-role-permissions';

interface EditRoleProps {
  createNewRole?: boolean; // to be used in the future for Create new role page
}

export const EditRole: FunctionComponent<EditRoleProps> = ({ createNewRole }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const pageTitle = intl.formatMessage(Messages.editCustomRole);
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const { selectedRole } = useSelector((state: RBACStore) => state.roleReducer);

  const breadcrumbsList = useMemo(
    () => [
      {
        title: intl.formatMessage(Messages.roles),
        to: mergeToBasename(pathnames['roles'].link),
      },
      {
        title: pageTitle,
        isActive: true,
      },
    ],
    [intl, pageTitle]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          roleId ? dispatch(fetchRole(roleId)) : Promise.resolve(),
        ]);
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
          },
        ],
      }),
      [initialFormData, roleId, intl]
    );

  return (
    <React.Fragment>
      <section className="pf-v5-c-page__main-breadcrumb">
        <RbacBreadcrumbs {...breadcrumbsList} />
      </section>
      <ContentHeader title={pageTitle} />
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
              // onSubmit={handleSubmit}
              // onCancel={returnToPreviousPage}
              FormTemplate={FormTemplate}
              FormTemplateProps={{
                disableSubmit: ['pristine', 'invalid'],
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
