import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';
import RbacBreadcrumbs from '../../../presentational-components/shared/breadcrumbs';
import { mergeToBasename } from '../../../presentational-components/shared/AppLink';
import pathnames from '../../../utilities/pathnames';

interface EditRoleProps {
  createNewRole?: boolean;
}

export const EditRole: React.FunctionComponent<EditRoleProps> = ({ createNewRole }) => {
  const intl = useIntl();
  const pageTitle = intl.formatMessage(Messages.editCustomRole);

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

  return (
    <React.Fragment>
      <section className="pf-v5-c-page__main-breadcrumb">
        <RbacBreadcrumbs {...breadcrumbsList} />
      </section>
      <ContentHeader title={pageTitle} />
      <PageSection data-ouia-component-id="edit-role-form" className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
        <div style={{ textAlign: 'center' }}>
          <Spinner />
        </div>
      </PageSection>
    </React.Fragment>
  );
};

export default EditRole;
