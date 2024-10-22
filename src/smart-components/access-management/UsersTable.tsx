import React, { useEffect, useCallback, useState, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { ButtonVariant, Pagination } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import { fetchUsers } from '../../redux/actions/user-actions';
import { mappedProps } from '../../helpers/shared/helpers';
import { RBACStore } from '../../redux/store';
import { User } from '../../redux/reducers/user-reducer';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { useSearchParams } from 'react-router-dom';
import { WarningModal } from '@patternfly/react-component-groups';

const COLUMNS: string[] = ['Username', 'Email', 'First name', 'Last name', 'Status', 'Org admin'];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const OUIA_ID = 'iam-users-table';

const UsersTable: React.FunctionComponent = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const dispatch = useDispatch();

  const intl = useIntl();

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent, user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const { users, totalCount } = useSelector((state: RBACStore) => ({
    users: state.userReducer.users.data || [],
    totalCount: state.userReducer.users.meta.count,
  }));

  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = useDataViewPagination({ perPage: 20, searchParams, setSearchParams });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a[0] === b[0] });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchUsers({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const rows = users.map((user: any) => [
    user.username,
    user.email,
    user.first_name,
    user.last_name,
    user.is_active ? 'Active' : 'Inactive',
    user.is_org_admin ? 'Yes' : 'No',
    {
      cell: (
        <ActionsColumn
          items={[
            { title: 'Add to user group', onClick: () => console.log('ADD TO USER GROUP') },
            {
              title: 'Remove from user groups',
              onClick: (event: KeyboardEvent | React.MouseEvent, rowId: number, rowData: any) => handleModalToggle(event, rowData),
            },
          ]}
          rowData={user}
        />
      ),
      props: { isActionCell: true },
    },
  ]);

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
    <Fragment>
      {isDeleteModalOpen && (
        <WarningModal
          ouiaId={`${OUIA_ID}-remove-user-modal`}
          isOpen={isDeleteModalOpen}
          title={intl.formatMessage(messages.deleteUserModalTitle)}
          confirmButtonLabel={intl.formatMessage(messages.remove)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            console.log(`Deleting ${currentUser?.username} from user groups`);
            //add delete user api call here when v2 is ready
            setIsDeleteModalOpen(false);
          }}
        >
          {`${currentUser?.username} ${intl.formatMessage(messages.deleteUserModalBody)}`}
        </WarningModal>
      )}
      <DataView ouiaId={OUIA_ID} selection={selection}>
        <DataViewToolbar
          ouiaId={`${OUIA_ID}-header-toolbar`}
          bulkSelect={
            <BulkSelect
              isDataPaginated
              pageCount={users.length}
              selectedCount={selected.length}
              totalCount={totalCount}
              pageSelected={pageSelected}
              pagePartiallySelected={pagePartiallySelected}
              onSelect={handleBulkSelect}
            />
          }
          pagination={React.cloneElement(paginationComponent, { isCompact: true })}
        />
        <DataViewTable variant="compact" aria-label="Users Table" ouiaId={`${OUIA_ID}-table`} columns={COLUMNS} rows={rows} />
        <DataViewToolbar ouiaId={`${OUIA_ID}-footer-toolbar`} pagination={paginationComponent} />
      </DataView>
    </Fragment>
  );
};

export default UsersTable;
