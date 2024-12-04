import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { FormGroup, PageSection, PageSectionVariants, Pagination, Tab, Tabs } from '@patternfly/react-core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { FormRenderer, UseFieldApiConfig, componentTypes, useFieldApi, useFormApi, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { DataView, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroup, fetchGroups, fetchServiceAccountsForGroup, updateGroup } from '../../redux/actions/group-actions';
import { RBACStore } from '../../redux/store';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUsers } from '../../redux/actions/user-actions';
import { mappedProps } from '../../helpers/shared/helpers';
import { fetchServiceAccounts } from '../../redux/actions/service-account-actions';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ServiceAccountsState } from '../../redux/reducers/service-account-reducer';
import { LAST_PAGE, ServiceAccount } from '../../helpers/service-account/service-account-helper';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

interface Diff {
  added: string[];
  removed: string[];
}

interface UsersTableProps {
  onChange: (userDiff: Diff) => void;
}

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const UsersTable: React.FunctionComponent<UsersTableProps> = ({ onChange }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const initialUserIds = useRef<string[]>([]);

  const { users, groupUsers, totalCount } = useSelector((state: RBACStore) => ({
    users: state.userReducer?.users?.data || [],
    groupUsers: state.groupReducer?.selectedGroup?.members?.data || [],
    totalCount: state.userReducer?.users?.meta?.count,
  }));

  const rows = users.map((user) => ({
    id: user.username,
    row: [user.is_org_admin ? 'Yes' : 'No', user.username, user.email, user.first_name, user.last_name, user.is_active ? 'Active' : 'Inactive'],
  }));

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
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

  useEffect(() => {
    const initialSelectedUsers = groupUsers.map((user) => ({ id: user.username }));
    onSelect(true, initialSelectedUsers);
    initialUserIds.current = initialSelectedUsers.map((user) => user.id);
  }, [groupUsers]);

  useEffect(() => {
    const selectedUserIds = selection.selected.map((user) => user.id);
    const added = selectedUserIds.filter((id) => !initialUserIds.current.includes(id));
    const removed = initialUserIds.current.filter((id) => !selectedUserIds.includes(id));
    onChange({ added, removed });
  }, [selection.selected]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  return (
    <DataView selection={{ ...selection }}>
      <DataViewToolbar
        pagination={
          <Pagination
            perPageOptions={PER_PAGE_OPTIONS}
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
          />
        }
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
      />
      <DataViewTable variant="compact" columns={['Org Admin', 'Username', 'Email', 'First name', 'Last name', 'Status']} rows={rows} />
    </DataView>
  );
};

interface ServiceAccountsTableProps {
  groupId?: string;
  onChange: (serviceAccounts: Diff) => void;
}

const reducer = ({ serviceAccountReducer }: { serviceAccountReducer: ServiceAccountsState }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  isLoading: serviceAccountReducer.isLoading,
  limit: serviceAccountReducer.limit,
  offset: serviceAccountReducer.offset,
});

const ServiceAccountsTable: React.FunctionComponent<ServiceAccountsTableProps> = ({ groupId, onChange }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const { auth, getEnvironmentDetails } = useChrome();
  const initialServiceAccountIds = useRef<string[]>([]);

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { onSelect, selected } = selection;

  const { serviceAccounts, status } = useSelector(reducer);
  const calculateTotalCount = () => {
    if (!serviceAccounts) return 0;
    const currentCount = (page - 1) * perPage + serviceAccounts.length;
    return status === LAST_PAGE ? currentCount : currentCount + 1;
  };
  const totalCount = calculateTotalCount();

  const { groupServiceAccounts: groupServiceAccounts } = useSelector((state: RBACStore) => ({
    groupServiceAccounts: state.groupReducer?.selectedGroup?.serviceAccounts?.data || [],
  }));

  const fetchData = useCallback(
    async (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      if (groupId) {
        const { count, limit, offset, orderBy } = apiProps;
        const env = getEnvironmentDetails();
        const token = await auth.getToken();
        dispatch(fetchServiceAccounts({ ...mappedProps({ count, limit, offset, orderBy, token, sso: env?.sso }) }));
        dispatch(fetchServiceAccountsForGroup(groupId, {}));
      }
    },
    [dispatch, groupId]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  const processedServiceAccounts = serviceAccounts ? serviceAccounts.slice(0, perPage) : [];
  const rows = processedServiceAccounts.map((account: ServiceAccount) => ({
    id: account.uuid,
    row: [
      account.name,
      account.description,
      account.clientId,
      account.createdBy,
      <DateFormat key={`${account.name}-date`} date={account.createdAt} />,
    ],
  }));

  useEffect(() => {
    // on mount, select the accounts that are in the current group
    const initialSelectedServiceAccounts = groupServiceAccounts.map((account) => ({ id: account.clientId }));
    onSelect(true, initialSelectedServiceAccounts);
    initialServiceAccountIds.current = initialSelectedServiceAccounts.map((account) => account.id);
  }, [groupServiceAccounts]);

  useEffect(() => {
    const selectedServiceAccountIds = selection.selected.map((account) => account.id);
    const added = selectedServiceAccountIds.filter((id) => !initialServiceAccountIds.current.includes(id));
    const removed = initialServiceAccountIds.current.filter((id) => !selectedServiceAccountIds.includes(id));
    onChange({ added, removed });
  }, [selection.selected]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const pageSelected = rows.length > 0 && rows.every((row) => selection.isSelected(row));
  const pagePartiallySelected = !pageSelected && rows.some((row) => selection.isSelected(row));

  return (
    <DataView selection={{ ...selection }}>
      <DataViewToolbar
        pagination={
          <Pagination
            isCompact
            perPageOptions={PER_PAGE_OPTIONS}
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
            toggleTemplate={() => {
              const firstIndex = (page - 1) * perPage + 1;
              const lastIndex = Math.min(page * perPage, totalCount);
              const totalNumber = status === LAST_PAGE ? (page - 1) * perPage + serviceAccounts.length : 'many';
              return (
                <React.Fragment>
                  <b>
                    {firstIndex} - {lastIndex}
                  </b>{' '}
                  of <b>{totalNumber}</b>
                </React.Fragment>
              );
            }}
          />
        }
        bulkSelect={
          <BulkSelect
            pageCount={serviceAccounts.length}
            selectedCount={selected.length}
            totalCount={totalCount}
            pageSelected={pageSelected}
            pagePartiallySelected={pagePartiallySelected}
            onSelect={handleBulkSelect}
          />
        }
      />
      <DataViewTable variant="compact" columns={['Name', 'Description', 'Client ID', 'Owner', 'Time created']} rows={rows} />
    </DataView>
  );
};

const EditGroupUsersAndServiceAccounts: React.FunctionComponent<UseFieldApiConfig> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const formOptions = useFormApi();
  const { input, groupId } = useFieldApi(props);
  const values = formOptions.getState().values[input.name];

  const handleUserChange = (users: Diff) => {
    input.onChange({
      users,
      serviceAccounts: values?.serviceAccounts,
    });
  };

  const handleServiceAccountsChange = (serviceAccounts: Diff) => {
    input.onChange({
      users: values?.users,
      serviceAccounts,
    });
  };

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    setActiveTabKey(Number(key));
  };

  return (
    <React.Fragment>
      <FormGroup label="Select users and/or service accounts">
        <Tabs activeKey={activeTabKey} onSelect={handleTabSelect}>
          <Tab eventKey={0} title="Users">
            <UsersTable onChange={handleUserChange} />
          </Tab>
          <Tab eventKey={1} title="Service accounts">
            <ServiceAccountsTable groupId={groupId} onChange={handleServiceAccountsChange} />
          </Tab>
        </Tabs>
      </FormGroup>
    </React.Fragment>
  );
};

const EditUserGroup: React.FunctionComponent = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const params = useParams();
  const groupId = params.groupId;
  const navigate = useNavigate();

  const group = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup);
  const allGroups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);

  const fetchCurrentGroup = useCallback(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [groupId]);

  useEffect(() => {
    dispatch(fetchGroups({ limit: 1000, offset: 0, orderBy: 'name', usesMetaInURL: true }));
  }, [dispatch]);

  useEffect(() => {
    fetchCurrentGroup();
  }, [fetchCurrentGroup]);

  const schema = {
    fields: [
      {
        name: 'name',
        label: intl.formatMessage(Messages.name),
        component: componentTypes.TEXT_FIELD,
        validate: [
          { type: validatorTypes.REQUIRED },
          (value: string) => {
            if (value === group?.name) {
              return undefined;
            }

            const isDuplicate = allGroups.some(
              (existingGroup) => existingGroup.name.toLowerCase() === value?.toLowerCase() && existingGroup.uuid !== groupId
            );

            return isDuplicate ? intl.formatMessage(Messages.groupNameTakenTitle) : undefined;
          },
        ],
        initialValue: group?.name,
      },
      {
        name: 'description',
        label: intl.formatMessage(Messages.description),
        component: componentTypes.TEXTAREA,
        initialValue: group?.description,
      },
      {
        name: 'users-and-service-accounts',
        component: 'users-and-service-accounts',
        groupId: groupId,
      },
    ],
  };

  const returnToPreviousPage = () => {
    navigate(-1);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (values.name !== group?.name || values.description !== group?.description) {
      dispatch(updateGroup({ uuid: groupId, name: values.name, description: values.description }));
      console.log(`Dispatched update group with name: ${values.name} and description: ${values.description}`);
    }
    if (values['users-and-service-accounts']) {
      const { users, serviceAccounts } = values['users-and-service-accounts'];
      if (users.added.length > 0) {
        console.log(`Users added: ${users.added}`);
      }
      if (users.removed.length > 0) {
        console.log(`Users removed: ${users.removed}`);
      }
      if (serviceAccounts.added.length > 0) {
        console.log(`Service accounts added: ${serviceAccounts.added}`);
      }
      if (serviceAccounts.removed.length > 0) {
        console.log(`Service accounts removed: ${serviceAccounts.removed}`);
      }
      returnToPreviousPage();
    }
  };

  return (
    <React.Fragment>
      <ContentHeader title={intl.formatMessage(Messages.usersAndUserGroupsEditUserGroup)} subtitle={''} />
      <PageSection className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
        <FormRenderer
          schema={schema}
          componentMapper={{
            ...componentMapper,
            'users-and-service-accounts': EditGroupUsersAndServiceAccounts,
          }}
          onSubmit={handleSubmit}
          onCancel={returnToPreviousPage}
          FormTemplate={FormTemplate}
        />
      </PageSection>
    </React.Fragment>
  );
};

export default EditUserGroup;
