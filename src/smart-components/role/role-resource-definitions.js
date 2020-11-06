import React, { Fragment, useEffect, useState } from 'react';
import { TextContent, Text, TextVariants, Level, LevelItem, Button } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './role-resource-definitions-table-helpers';
import { useParams, Link, Route } from 'react-router-dom';
import { TopToolbar } from '../../presentational-components/shared/top-toolbar';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/components/PageHeader';
import { ToolbarTitlePlaceholder } from '../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../helpers/shared/pagination';
import { fetchRole } from '../../redux/actions/role-actions';
import { routes as paths } from '../../../package.json';
import EditResourceDefinitionsModal from './edit-resource-definitions-modal';
import flatten from 'lodash/flatten';
import './role-permissions.scss';

const ResourceDefinitions = () => {
  const [config, setConfig] = useState({
    pagination: {
      ...defaultSettings,
      filter: '',
    },
  });

  const { pagination, filter } = config;

  const dispatch = useDispatch();

  const { roleId, permissionId } = useParams();

  const { role, permission, isRecordLoading } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      permission: state.roleReducer.selectedRole.access
        ? {
            ...state.roleReducer.selectedRole?.access.find((a) => a.permission === permissionId),
          }
        : {},
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const fetchData = () => {
    dispatch(fetchRole(roleId));
  };

  useEffect(() => {
    fetchData();
  }, [roleId]);

  useEffect(() => {
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: role.access ? role.access.length : 0,
      },
    });
  }, [role]);

  const filteredRows = permission.resourceDefinitions
    ? flatten(permission.resourceDefinitions.map((definition) => definition.attributeFilter.value)).filter((value) =>
        filter ? value.includes(filter) : true
      )
    : [];

  const routes = () => (
    <Fragment>
      <Route exact path={paths['role-detail-permission-edit']}>
        <EditResourceDefinitionsModal
          cancelRoute={paths['role-detail-permission'].replace(':roleId', roleId).replace(':permissionId', permissionId)}
        />
      </Route>
    </Fragment>
  );

  const toolbarButtons = () =>
    !role.system
      ? [
          <Fragment key="edit-resource-definitions">
            <Link to={`/roles/detail/${roleId}/permission/${permissionId}/edit`}>
              <Button variant="primary" aria-label="Edit">
                Edit
              </Button>
            </Link>
          </Fragment>,
        ]
      : [];

  return (
    <Fragment>
      <TopToolbar
        breadcrumbs={[
          { title: 'Roles', to: '/roles' },
          { title: isRecordLoading ? undefined : role && (role.display_name || role.name), to: `/roles/detail/${roleId}` },
          { title: permissionId, isActive: true },
        ]}
      >
        <Level>
          <LevelItem>
            <PageHeaderTitle title={permissionId || <ToolbarTitlePlaceholder />} className="ins-rbac-page-header__title" />
          </LevelItem>
        </Level>
      </TopToolbar>
      <section className="pf-c-page__main-section ins-c-role__permissions">
        <TextContent>
          <Text component={TextVariants.h1}>Defined resources</Text>
        </TextContent>
        <TableToolbarView
          columns={[{}]}
          createRows={createRows}
          data={filteredRows.slice(pagination.offset, pagination.offset + pagination.limit)}
          filterValue={filter}
          fetchData={({ limit, offset, name }) =>
            setConfig({
              ...config,
              filter: name,
              pagination: {
                ...config.pagination,
                limit,
                offset,
              },
            })
          }
          isCompact
          routes={routes}
          setFilterValue={({ name }) =>
            setConfig({
              ...config,
              filter: name,
            })
          }
          toolbarButtons={toolbarButtons}
          isLoading={isRecordLoading}
          pagination={{
            ...pagination,
            count: filteredRows.length,
          }}
          titlePlural="resources"
          titleSingular="resource"
          hideHeader
        />
      </section>
    </Fragment>
  );
};

export default ResourceDefinitions;
