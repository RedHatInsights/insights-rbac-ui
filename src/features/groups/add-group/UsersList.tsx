import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { nowrap } from '@patternfly/react-table';
import { fetchUsers, updateUsersFilters } from '../../../redux/users/actions';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import PermissionsContext from '../../../utilities/permissionsContext';
import { defaultAdminSettings, defaultSettings, isPaginationPresentInUrl, syncDefaultPaginationWithUrl } from '../../../helpers/pagination';
import { areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../../helpers/urlFilters';
import messages from '../../../Messages';
// Removed createRows import - not needed for this component
import type { User, UsersListProps } from './types';

export const UsersList: React.FC<UsersListProps> = ({ selectedUsers, setSelectedUsers, usesMetaInURL = false, displayNarrow = false }) => {
  // Wrapper function to handle both function and value setters
  const handleSetSelectedUsers = (users: User[] | ((prev: User[]) => User[])) => {
    if (typeof users === 'function') {
      setSelectedUsers(users);
    } else {
      setSelectedUsers(users);
    }
  };
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { orgAdmin } = useContext(PermissionsContext);

  // for usesMetaInURL (Users page) store pagination settings in Redux, otherwise use results from meta
  let pagination = useSelector(({ userReducer }: any) => {
    const { users } = userReducer;
    return {
      limit: (usesMetaInURL ? users.pagination.limit : users.meta.limit) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
      offset: (usesMetaInURL ? users.pagination.offset : users.meta.offset) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
      count: usesMetaInURL ? users.pagination.count : users.meta.count,
      redirected: usesMetaInURL && users.pagination.redirected,
    };
  });

  const { users, isLoading, stateFilters } = useSelector(({ userReducer }: any) => {
    const {
      users: { data, filters = {} },
      isUserDataLoading,
    } = userReducer;
    return {
      users: data?.map?.((data: any) => ({ ...data, uuid: data.username })),
      isLoading: isUserDataLoading,
      stateFilters: location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] },
    };
  });

  const columns = [
    {
      title: intl.formatMessage(messages.username),
      key: 'username',
      transforms: [nowrap],
      cellTransforms: [nowrap],
      props: {
        isStatic: true,
        width: 20,
      },
    },
    {
      title: intl.formatMessage(messages.email),
      transforms: [nowrap],
      cellTransforms: [nowrap],
      props: {
        isStatic: true,
        width: 25,
      },
    },
    {
      title: intl.formatMessage(messages.firstName),
      transforms: [nowrap],
      cellTransforms: [nowrap],
    },
    {
      title: intl.formatMessage(messages.lastName),
      transforms: [nowrap],
      cellTransforms: [nowrap],
    },
    {
      title: intl.formatMessage(messages.orgAdministrator),
      transforms: [nowrap],
      cellTransforms: [nowrap],
    },
  ].filter(Boolean);

  // Create user rows for table - simplified for this component
  const userRows =
    users?.map((user: User) => ({
      uuid: user.uuid || user.username,
      cells: [user.username, user.email || '', user.first_name || '', user.last_name || '', user.is_active ? 'Active' : 'Inactive'],
      selected: selectedUsers.some((selected) => selected.uuid === user.uuid || selected.username === user.username),
    })) || [];

  const filteredUsers = users?.filter?.((user: User) =>
    Object.keys(stateFilters).every((key: string) => {
      if (!stateFilters[key] || (Array.isArray(stateFilters[key]) && stateFilters[key].length === 0)) {
        return true;
      }
      if (key === 'status') {
        return stateFilters[key].includes(user.is_active ? 'Active' : 'Inactive');
      }
      if (key === 'username') {
        return user.username?.toLowerCase().includes(stateFilters[key].toLowerCase());
      }
      if (key === 'email') {
        return user.email?.toLowerCase().includes(stateFilters[key].toLowerCase());
      }
      return true;
    }),
  );

  const updateUsers = useCallback(
    (config: any) => {
      if (usesMetaInURL && location.pathname.includes('users')) {
        dispatch(updateUsersFilters(config));
      }
      dispatch(fetchUsers(config));
    },
    [dispatch, usesMetaInURL, location.pathname],
  );

  useEffect(() => {
    if (usesMetaInURL) {
      const filtersInUrl = areFiltersPresentInUrl(location, ['status', 'username', 'email']);
      const paginationInUrl = isPaginationPresentInUrl(location);

      if (!filtersInUrl && !paginationInUrl) {
        syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], { status: ['Active'] });
        syncDefaultPaginationWithUrl(location, navigate, orgAdmin ? defaultAdminSettings : defaultSettings);
      }
    }

    const config = {
      ...pagination,
      usesMetaInURL,
      filters: stateFilters,
    };
    updateUsers(config);
  }, []);

  return (
    <TableToolbarView
      columns={columns}
      isSelectable
      isCompact={displayNarrow}
      rows={userRows}
      data={filteredUsers}
      isLoading={isLoading}
      pagination={pagination}
      checkedRows={selectedUsers}
      setCheckedItems={handleSetSelectedUsers}
      toolbarButtons={() => []}
      titlePlural={intl.formatMessage(messages.users)}
      titleSingular={intl.formatMessage(messages.user)}
      tableId="users-list"
      ouiaId="users-list"
      emptyProps={{
        title: 'No users found',
        description: ['No users match the current filter criteria'],
      }}
      filters={[
        {
          key: 'username',
          value: stateFilters.username || '',
          label: intl.formatMessage(messages.username),
          placeholder: intl.formatMessage(messages.filterByKey, {
            key: intl.formatMessage(messages.username).toLowerCase(),
          }),
        },
      ]}
      isFilterable
      routes={() => null}
      fetchData={(config: any) => updateUsers({ ...config, usesMetaInURL })}
      setFilterValue={(filters: any) => {
        const config = {
          ...pagination,
          offset: 0,
          usesMetaInURL,
          filters: { ...stateFilters, ...filters },
        };
        updateUsers(config);
      }}
      filterValue={stateFilters as any}
      emptyFilters={{ username: '', email: '', status: ['Active'] }}
    />
  );
};
