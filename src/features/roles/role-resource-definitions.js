import React, { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Level } from '@patternfly/react-core';
import { LevelItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { TableToolbarView } from '../../components/tables/TableToolbarView';
import { createRows, isInventoryPermission } from './role-resource-definitions-table-helpers';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { ToolbarTitlePlaceholder } from '../../components/ui-states/LoaderPlaceholders';
import { defaultSettings } from '../../helpers/pagination';
import { fetchRole } from '../../redux/roles/actions';
import paths from '../../utilities/pathnames';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { getBackRoute } from '../../helpers/navigation';
import { useIntl } from 'react-intl';
import { fetchInventoryGroupsDetails } from '../../redux/inventory/actions';
import { processResourceDefinitions } from '../../redux/inventory/helper';
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
  const toAppLink = useAppLink();

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
    shallowEqual,
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
          !isInventory || item == null ? item : inventoryGroupsDetails?.[item]?.name,
        )) ||
      [],
    [permissionId, isRoleLoading, isLoadingInventoryDetails],
  );
  const filteredData = useMemo(() => allData.filter((value) => (filter ? value?.includes(filter) || value === null : true)), [allData, filter]);
  const data = useMemo(
    () => filteredData.slice(pagination.offset, pagination.offset + pagination.limit),
    [filteredData, pagination.offset, pagination.offset],
  );

  return (
    <Fragment>
      <PageLayout
        breadcrumbs={[
          { title: intl.formatMessage(messages.roles), to: getBackRoute(toAppLink(paths['roles'].link), rolesPagination, rolesFilters) },
          {
            title: isRoleLoading ? undefined : role && (role.display_name || role.name),
            to: toAppLink(paths['role-detail'].link.replace(':roleId', roleId)),
          },
          { title: permissionId, isActive: true },
        ]}
      >
        <Level>
          <LevelItem>
            <PageHeaderTitle title={permissionId || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
          </LevelItem>
        </Level>
      </PageLayout>
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
