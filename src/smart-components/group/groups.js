import React, { Fragment, useState, useEffect } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchGroups } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import Role from '../role/role';
import GroupRowWrapper from './group-row-wrapper';
import './groups.scss';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Roles', 'Members', 'Last modified' ];

const Groups = () => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedRows, setSelectedRows ] = useState([]);
  const [ removeGroupsList, setRemoveGroupsList ] = useState([]);

  const dispatch = useDispatch();
  const { groups, pagination, userIdentity, isLoading } = useSelector(({ groupReducer: { groups, isLoading }}) => ({
    groups: groups.data,
    pagination: groups.meta,
    userIdentity: groups.identity,
    isLoading
  }), shallowEqual);

  useEffect(() => {
    dispatch(fetchGroups({ ...pagination, name: filterValue }));
  }, []);

  const history = useHistory();

  const fetchData = (config) => {
    dispatch(fetchGroups(config));
  };

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) => newSelection(rows)
    .filter(({ platform_default: isPlatformDefault }) => !isPlatformDefault)
    .map(({ uuid, name }) => ({ uuid, label: name })));
  };

  const routes = () => <Fragment>
    <Route exact path="/groups/add-group" render={ props => <AddGroupWizard { ...props } postMethod={ () => {
      fetchData();
      setFilterValue('');
    } } /> } />
    <Route exact path="/groups/edit/:id" render={ props => <EditGroup { ...props } postMethod={ () => {
      fetchData();
      setFilterValue('');
    } } isOpen/> } />
    <Route exact path="/groups/removegroups" render={ props => <RemoveGroup { ...props } postMethod={ (ids) => {
      fetchData();
      setSelectedRows(selectedRows.filter(row => (!ids.includes(row.uuid))));
      setFilterValue('');
    } } isModalOpen groupsUuid={ removeGroupsList } /> } />
  </Fragment>;

  const actionResolver = ({ isPlatformDefault }) =>
    isPlatformDefault || !(userIdentity && userIdentity.user && userIdentity.user.is_org_admin) ? null :
      [
        {
          title: 'Edit group',
          onClick: (_event, _rowId, group) => {
            history.push(`/groups/edit/${group.uuid}`);}
        },
        {
          title: 'Delete group',
          onClick: (_event, _rowId, group) => {
            setRemoveGroupsList([ group ]);
            history.push(`/groups/removegroups`);
          }
        }
      ];

  const toolbarButtons = () => [
    ...userIdentity && userIdentity.user && userIdentity.user.is_org_admin ?
      [
        <Link to="/groups/add-group" key="add-group">
          <Button
            variant="primary"
            aria-label="Create group"
          >
        Create group
          </Button>
        </Link>,
        {
          label: 'Edit group',
          props: {
            isDisabled: !(selectedRows.length === 1)
          },
          onClick: () => history.push(`/groups/edit/${selectedRows[0].uuid}`)
        },
        {
          label: 'Delete Group(s)',
          props: {
            isDisabled: !selectedRows.length > 0
          },
          onClick: () => {
            setRemoveGroupsList(selectedRows);
            history.push(`/groups/removegroups`);
          }
        }
      ] : []
  ];

  const renderGroupsList = () =>
    <Stack>
      <StackItem>
        <TopToolbar paddingBottom>
          <TopToolbarTitle title="Groups"/>
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'tab-groups' }>
          <TableToolbarView
            data={ groups.map(group => group.platform_default ? { ...group, principalCount: 'All' } : group) }
            createRows={ createRows }
            columns={ columns }
            isSelectable={ userIdentity && userIdentity.user && userIdentity.user.is_org_admin }
            checkedRows={ selectedRows }
            setCheckedItems={ setCheckedItems }
            routes={ routes }
            actionResolver={ actionResolver }
            titlePlural="groups"
            titleSingular="group"
            pagination={ pagination }
            filterValue={ filterValue }
            fetchData={ fetchData }
            setFilterValue={ ({ name }) => setFilterValue(name) }
            toolbarButtons={ toolbarButtons }
            isLoading={ isLoading }
            filterPlaceholder="name"
            rowWrapper={ GroupRowWrapper }
          />
        </Section>
      </StackItem>
    </Stack>;
  return (
    <Switch>
      <Route path={ '/groups/detail/:groupUuid/roles/detail/:uuid' } render={ props => <Role { ...props }/> } />
      <Route path={ '/groups/detail/:uuid' } render={ props => <Group { ...props }/> } />
      <Route path={ '/groups' } render={ () => renderGroupsList() } />
    </Switch>
  );
};

export default Groups;
