import { UseFieldApiConfig, useFieldApi, useFormApi } from '@data-driven-forms/react-form-renderer';
import { EmptyState, EmptyStateHeader, EmptyStateIcon, FormGroup, Pagination } from '@patternfly/react-core';
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  DataViewTh,
  DataViewState,
  DataViewTextFilter,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
} from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../redux/store';
import { useSearchParams } from 'react-router-dom';
import messages from '../../../Messages';
import { PER_PAGE_OPTIONS } from '../../../helpers/shared/pagination';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { listPermissions } from '../../../redux/actions/permission-action';

interface PermissionsFilters {
  application: string;
  resourceType: string;
  operation: string;
}

interface ExtendedUseFieldApiConfig extends UseFieldApiConfig {
  roleId?: string;
}

const EmptyTable: React.FC<{ titleText: string }> = ({ titleText }) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
  </EmptyState>
);

export const EditRolePermissions: React.FC<ExtendedUseFieldApiConfig> = (props) => {
  const formOptions = useFormApi();
  const { input, roleId } = useFieldApi(props);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const intl = useIntl();
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);

  const columns = [
    {
      label: intl.formatMessage(messages.application),
      key: 'application',
      index: 0,
    },
    {
      label: intl.formatMessage(messages.resourceType),
      key: 'resourceType',
      index: 1,
    },
    { label: intl.formatMessage(messages.operation), key: 'operation', index: 2 },
  ];



  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
  }));

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<PermissionsFilters>({
    initialFilters: {
      application: searchParams.get('application') || '',
      resourceType: searchParams.get('resourceType') || '',
      operation: searchParams.get('operation') || '',
    },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: 10,
    searchParams,
    setSearchParams,
  });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

//   const { roles, totalCount, isLoading } = useSelector((state: RBACStore) => ({
//     roles: state.roleReducer.roles?.data || [],
//     totalCount: state.roleReducer.roles?.meta?.count || 0,
//     isLoading: state.roleReducer.isLoading,
//   }));
  // get permissions?
  
  const { permission, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    permission: [],
    totalCount: 0,
    isLoading: false,
    }));

  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.label)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  // fix
  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; filters?: PermissionsFilters }) => {
      const { count, limit, offset, filters } = apiProps;
      dispatch(
        listPermissions({ // not sure what should go in some of these fields ?
            limit,
            offset,
            application: filters?.application || '',
            resourceType: filters?.resourceType || '',
            verb: filters?.operation || '',
            allowed_only: true,
            options: '',
            orderBy: 'application',
            permission: 'access',
            exclude_roles: '',
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      count: totalCount || 0,
      filters,
    });
  }, [fetchData, page, perPage, filters, totalCount]);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(totalCount === 0 ? DataViewState.empty : undefined);
    }
  }, [totalCount, isLoading]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const rows = useMemo(() => {
    return permission.map((permissions: any) => ({
      id: Math.random().toString(36).substring(7),
      row: [
        'Action here',
        'Resource Type here',
        'Verb here',
      ],
    }));
  }, [permission]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);

  const paginationComponent = (
    <Pagination
      perPageOptions={PER_PAGE_OPTIONS}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <React.Fragment>
      <FormGroup label="Select permissions" fieldId="role-permissions">
        <DataView ouiaId="edit-role-permissions" selection={selection} activeState={activeState}>
          <DataViewToolbar
            ouiaId="edit-role-permissions-toolbar"
            bulkSelect={
              <BulkSelect
                isDataPaginated
                pageCount={rows.length}
                selectedCount={selected.length}
                totalCount={totalCount}
                pageSelected={pageSelected}
                pagePartiallySelected={pagePartiallySelected}
                onSelect={handleBulkSelect}
              />
            }
            pagination={React.cloneElement(paginationComponent, { isCompact: true })}
            filters={
              <DataViewFilters ouiaId="edit-role-permissions-filters" onChange={(_e, values) => onSetFilters(values)} values={filters}>
                <DataViewTextFilter
                  filterId="application"
                  title={intl.formatMessage(messages.application)}
                  placeholder={intl.formatMessage(
                    messages.application
                  )}
                  ouiaId="application-filter"
                />
                <DataViewTextFilter
                  filterId="resourceType"
                  title={intl.formatMessage(messages.resourceType || { id: 'resourceType', defaultMessage: 'Resource Type' })}
                  placeholder={intl.formatMessage(
                    messages.resourceType
                  )}
                  ouiaId="resource-type-filter"
                />
                <DataViewTextFilter
                  filterId="operation"
                  title={intl.formatMessage(messages.operation)}
                  placeholder={intl.formatMessage(messages.operation)}
                  ouiaId="operation-filter"
                />
              </DataViewFilters>
            }
            clearAllFilters={clearAllFilters}
          />
          <DataViewTable
            variant="compact"
            aria-label="Permissions Table"
            ouiaId="permissions-table"
            columns={sortableColumns}
            rows={rows}
            headStates={{ loading: loadingHeader }}
            bodyStates={{
              loading: loadingBody,
              empty: (
                <EmptyTable
                  titleText={intl.formatMessage(
                    messages.noPermissions
                  )}
                />
              ),
            }}
          />
          <DataViewToolbar ouiaId="edit-role-permissions-footer-toolbar" pagination={paginationComponent} />
        </DataView>
      </FormGroup>
    </React.Fragment>
  );
};
