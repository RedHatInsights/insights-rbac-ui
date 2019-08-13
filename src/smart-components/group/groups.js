import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import AddGroupWizard from './add-group/add-group-wizard';
import AddGroup from './add-group-modal';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import RemoveGroup from './remove-group-modal';
import { createRows } from './group-table-helpers';
import { fetchGroups } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import AppTabs from '../app-tabs/app-tabs';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members' ];
const tabItems = [{ eventKey: 0, title: 'Groups', name: '/groups' }];

const Groups = ({ fetchGroups, groups, pagination, history }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const fetchData = (setRows) => {
    fetchGroups().then(({ value: { data }}) => setRows(createRows(data, filterValue)));
  };

  const routes = () => <Fragment>
    <Route exact path="/groups/add_group/:id" render={ props => <AddGroupWizard { ...props }
      postMethod={ fetchGroups } /> }/>
    <Route exact path="/groups/edit/:id" render={ props => <AddGroup { ...props }
      postMethod={ fetchGroups }/> } />
    <Route exact path="/groups/deny/:id" render={ props => <RemoveGroup { ...props }
      postMethod={ fetchGroups }/> } />
  </Fragment>;

  const actionResolver = (_groupData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, group) =>
            history.push(`/groups/edit/${group.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, group) =>
            history.push(`/groups/remove/${group.uuid}`)
        }
      ];

  const renderGroupsList = () =>
    <Fragment>
      <TopToolbar>
        <TopToolbarTitle title="Access Management" />
        <AppTabs tabItems={ tabItems }/>
      </TopToolbar>
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
      />
    </Fragment>;

  return (
    <Switch>
      <Route path={ '/groups/detail/:id' } render={ props => <Group { ...props }/> } />
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

const mapDispatchToProps = dispatch => {
  return {
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps))
  };
};

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
  pagination: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(Groups);
