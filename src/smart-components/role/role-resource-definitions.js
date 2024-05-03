import React, { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { TextContent, Text, TextVariants, Level, LevelItem, Button } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { useParams, Outlet } from 'react-router-dom';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows, isInventoryPermission } from './role-resource-definitions-table-helpers';
import { TopToolbar } from '../../presentational-components/shared/top-toolbar';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { ToolbarTitlePlaceholder } from '../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../helpers/shared/pagination';
import { fetchRole } from '../../redux/actions/role-actions';
import paths from '../../utilities/pathnames';
import AppLink, { mergeToBasename } from '../../presentational-components/shared/AppLink';
import { getBackRoute } from '../../helpers/shared/helpers';
import { useIntl } from 'react-intl';
import { fetchInventoryGroupsDetails } from '../../redux/actions/inventory-actions';
import { processResourceDefinitions } from '../../helpers/role/inventory-helper';
import messages from '../../Messages';
import './role-permissions.scss';

const ResourceDefinitions = () => {
  const intl = useIntl();
  const [config, setConfig] = useState({
    pagination: {
      ...defaultSettings,
      filter: '',
    },
  });

  const { pagination, filter } = config;

  const dispatch = useDispatch();

  const { roleId, permissionId } = useParams();
  const isInventory = useMemo(() => isInventoryPermission(permissionId), [permissionId]);

  const { role, permission, isRoleLoading, rolesPagination, rolesFilters, inventoryGroupsDetails, isLoadingInventoryDetails } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      permission: state.roleReducer.selectedRole.access
        ? {
            ...state.roleReducer.selectedRole?.access.find((a) => a.permission === permissionId),
          }
        : {},
      isRoleLoading: state.roleReducer.isRecordLoading,
      rolesPagination: state.roleReducer?.roles?.pagination || defaultSettings,
      rolesFilters: state.roleReducer?.roles?.filters || {},
      inventoryGroupsDetails: state.inventoryReducer?.inventoryGroupsDetails,
      isLoadingInventoryDetails: state.inventoryReducer?.isLoading,
    }),
    shallowEqual
  );

  const fetchInventoryGroupNames = (inventoryGroupsIds) => dispatch(fetchInventoryGroupsDetails(inventoryGroupsIds));

  const fetchData = () => {
    dispatch(fetchRole(roleId)).then(({ value }) => {
      isInventory &&
        fetchInventoryGroupNames(processResourceDefinitions(value?.access?.find((item) => item.permission === permissionId)?.resourceDefinitions));
    });
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

  const toolbarButtons = () =>
    !role.system
      ? [
          <Fragment key="edit-resource-definitions">
            <AppLink to={paths['role-detail-permission-edit'].link.replace(':roleId', roleId).replace(':permissionId', permissionId)}>
              <Button variant="primary" aria-label="Edit">
                {intl.formatMessage(messages.edit)}
              </Button>
            </AppLink>
          </Fragment>,
        ]
      : [];

  const allData = useMemo(
    () =>
      (!isRoleLoading &&
        !isLoadingInventoryDetails &&
        processResourceDefinitions(permission.resourceDefinitions).map((item) =>
          !isInventory || item == null ? item : inventoryGroupsDetails?.[item]?.name
        )) ||
      [],
    [permissionId, isRoleLoading, isLoadingInventoryDetails]
  );
  const filteredData = useMemo(() => allData.filter((value) => (filter ? value?.includes(filter) || value === null : true)), [allData, filter]);
  const data = useMemo(
    () => filteredData.slice(pagination.offset, pagination.offset + pagination.limit),
    [filteredData, pagination.offset, pagination.offset]
  );

  return (
    <Fragment>
      <TopToolbar
        breadcrumbs={[
          { title: intl.formatMessage(messages.roles), to: getBackRoute(mergeToBasename(paths['roles'].link), rolesPagination, rolesFilters) },
          {
            title: isRoleLoading ? undefined : role && (role.display_name || role.name),
            to: mergeToBasename(paths['role-detail'].link.replace(':roleId', roleId)),
          },
          { title: permissionId, isActive: true },
        ]}
      >
        <Level>
          <LevelItem>
            <PageHeaderTitle title={permissionId || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
          </LevelItem>
        </Level>
      </TopToolbar>
      <section className="pf-v5-c-page__main-section rbac-c-role__permissions">
        <TextContent>
          <Text component={TextVariants.h1}>{intl.formatMessage(messages.definedResources)}</Text>
        </TextContent>
        <TableToolbarView
          columns={[{}]}
          rows={createRows(data, permissionId, intl)}
          data={data}
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
          setFilterValue={({ name }) =>
            setConfig({
              ...config,
              filter: name,
            })
          }
          toolbarButtons={toolbarButtons}
          isLoading={isRoleLoading || (isInventory && isLoadingInventoryDetails)}
          pagination={{
            ...pagination,
            count: filteredData.length,
          }}
          titlePlural={intl.formatMessage(messages.resources).toLowerCase()}
          titleSingular={intl.formatMessage(messages.resource).toLowerCase()}
          hideHeader
          tableId="role-resource-definitions"
        />
        <Suspense>
          <Outlet
            context={{
              cancelRoute: paths['role-detail-permission'].link.replace(':roleId', roleId).replace(':permissionId', permissionId),
            }}
          />
        </Suspense>
      </section>
    </Fragment>
  );
};

export default ResourceDefinitions;
