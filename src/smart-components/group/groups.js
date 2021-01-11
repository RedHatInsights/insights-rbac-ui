import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchGroups, fetchSystemGroup } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import Role from '../role/role';
import GroupRowWrapper from './group-row-wrapper';
import { routes as paths } from '../../../package.json';
import './groups.scss';
import PageActionRoute from '../common/page-action-route';

const columns = [
  { title: 'Name', key: 'name', transforms: [sortable] },
  { title: 'Roles' },
  { title: 'Members' },
  { title: 'Last modified', key: 'modified', transforms: [sortable] },
];

const Groups = () => {
  const [filterValue, setFilterValue] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);

  const dispatch = useDispatch();
  const { groups, pagination, userIdentity, isLoading } = useSelector(
    ({ groupReducer: { groups, isLoading, systemGroup } }) => ({
      groups: [
        ...(systemGroup?.name?.match(new RegExp(filterValue, 'i')) ? [systemGroup] : []),
        ...(groups?.data?.filter(({ platform_default } = {}) => !platform_default) || []),
      ],
      pagination: groups.meta,
      userIdentity: groups.identity,
      isLoading,
      systemGroup,
    }),
    shallowEqual
  );

  useEffect(() => {
    insights.chrome.appNavClick({ id: 'groups', secondaryNav: true });
    dispatch(fetchGroups({ ...pagination, name: filterValue }));
    dispatch(fetchSystemGroup(filterValue));
  }, []);

  const history = useHistory();

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault }) => !isPlatformDefault)
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  const routes = () => (
    <Fragment>
      <Route exact path={paths['add-group']}>
        <AddGroupWizard
          postMethod={(config) => {
            dispatch(fetchGroups(config));
            setFilterValue('');
          }}
        />
      </Route>
      <Route exact path={paths['group-edit'].path}>
        <EditGroup
          postMethod={(config) => {
            dispatch(fetchGroups(config));
            setFilterValue('');
          }}
          isOpen
        />
      </Route>
      <Route exact path={paths['remove-group']}>
        <RemoveGroup
          postMethod={(ids) => {
            dispatch(fetchGroups());
            setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
            setFilterValue('');
          }}
          isModalOpen
          groupsUuid={removeGroupsList}
        />
      </Route>
    </Fragment>
  );

  const actionResolver = ({ isPlatformDefault }) =>
    isPlatformDefault || !(userIdentity && userIdentity.user && userIdentity.user.is_org_admin)
      ? null
      : [
          {
            title: 'Edit',
            onClick: (_event, _rowId, group) => {
              history.push(`/groups/edit/${group.uuid}`);
            },
          },
          {
            title: 'Delete',
            onClick: (_event, _rowId, group) => {
              setRemoveGroupsList([group]);
              history.push(paths['remove-group']);
            },
          },
        ];

  // TODO check this later
  const toolbarButtons = () => [
    ...(userIdentity && userIdentity.user && userIdentity.user.is_org_admin
      ? [
          <Link to={paths['add-group']} key="add-group" className="pf-m-visible-on-md">
            <Button ouiaId="create-group-button" variant="primary" aria-label="Create group">
              Create group
            </Button>
          </Link>,
          {
            label: 'Create group',
            props: {
              className: 'pf-m-hidden-on-md',
            },
            onClick: () => {
              history.push(paths['add-group']);
            },
          },
          {
            label: 'Edit',
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => history.push(`/groups/edit/${selectedRows[0].uuid}`),
          },
          {
            label: 'Delete',
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveGroupsList(selectedRows);
              history.push(paths['remove-group']);
            },
          },
        ]
      : []),
  ];

  const renderGroupsList = () => (
    <Stack>
      <StackItem>
        <TopToolbar paddingBottom>
          <TopToolbarTitle title="Groups" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-groups'}>
          <TableToolbarView
            data={groups.map((group) => (group.platform_default ? { ...group, principalCount: 'All' } : group))}
            createRows={createRows}
            columns={columns}
            isSelectable={userIdentity && userIdentity.user && userIdentity.user.is_org_admin}
            checkedRows={selectedRows}
            setCheckedItems={setCheckedItems}
            routes={routes}
            actionResolver={actionResolver}
            titlePlural="groups"
            titleSingular="group"
            ouiaId="groups-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={(config) => dispatch(fetchGroups(config))}
            setFilterValue={({ name }) => setFilterValue(name)}
            toolbarButtons={toolbarButtons}
            isLoading={isLoading}
            filterPlaceholder="name"
            rowWrapper={GroupRowWrapper}
          />
        </Section>
      </StackItem>
    </Stack>
  );
  return (
    <Switch>
      <PageActionRoute pageAction="role-detail" path={paths['group-detail-role-detail']} render={(props) => <Role {...props} />} />
      <PageActionRoute
        pageAction="group-detail"
        path={paths['group-detail']}
        render={(props) => <Group {...props} onDelete={() => setFilterValue('')} />}
      />
      <PageActionRoute pageAction="group-list" path={paths.groups} render={() => renderGroupsList()} />
    </Switch>
  );
};

export default Groups;
