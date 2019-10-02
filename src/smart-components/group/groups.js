import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Link, Route, Switch } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import { Button, Stack, StackItem, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchGroups } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import AppTabs from '../app-tabs/app-tabs';
import { defaultSettings } from '../../helpers/shared/pagination';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members', 'Last modified' ];
const tabItems = [
  { eventKey: 0, title: 'Groups', name: '/groups' },
  { eventKey: 1, title: 'Roles', name: '/roles' }
];

const Groups = ({ fetchGroups, isLoading, pagination, history: { push }}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ groups, setGroups ] = useState([]);

  const fetchData = () => {
    fetchGroups(pagination).then(({ value: { data }}) => setGroups(data));
  };

  const routes = () => <Fragment>
    <Route exact path="/groups/add-group" render={ props => <AddGroupWizard { ...props } postMethod={ fetchData } /> } />
    <Route exact path="/groups/edit/:id" render={ props => <EditGroup { ...props } postMethod={ fetchData } /> } />
    <Route exact path="/groups/remove/:id" render={ props => <RemoveGroup { ...props } postMethod={ fetchData } /> } />
  </Fragment>;

  const actionResolver = (_groupData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, group) => {
            push(`/groups/edit/${group.uuid}`);}
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, group) =>
            push(`/groups/remove/${group.uuid}`)
        }
      ];

  const toolbarButtons = () => <ToolbarGroup>
    <ToolbarItem>
      <Link to="/groups/add-group">
        <Button
          variant="primary"
          aria-label="Create group"
        >
          Add group
        </Button>
      </Link>
    </ToolbarItem>
  </ToolbarGroup>;

  const renderGroupsList = () =>
    <Stack>
      <StackItem>
        <TopToolbar paddingBottm={ false }>
          <TopToolbarTitle title="User access management"/>
          <AppTabs tabItems={ tabItems }/>
        </TopToolbar>
      </StackItem>
      <StackItem>
        <TableToolbarView
          data={ groups }
          createRows={ createRows }
          columns={ columns }
          fetchData={ fetchData }
          request={ fetchGroups }
          routes={ routes }
          actionResolver={ actionResolver }
          titlePlural="groups"
          titleSingular="group"
          pagination={ pagination }
          filterValue={ filterValue }
          setFilterValue={ setFilterValue }
          toolbarButtons = { toolbarButtons }
          isLoading = { isLoading }
        />
      </StackItem>
    </Stack>;
  return (
    <Switch>
      <Route path={ '/groups/detail/:uuid' } render={ props => <Group { ...props }/> } />
      <Route path={ '/groups' } render={ () => renderGroupsList() } />
    </Switch>
  );
};

const mapStateToProps = ({ groupReducer: { groups, filterValue, isLoading }}) => ({
  groups: groups.data,
  pagination: groups.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroups
}, dispatch);

Groups.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  groups: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchGroups: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Groups.defaultProps = {
  groups: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Groups);
