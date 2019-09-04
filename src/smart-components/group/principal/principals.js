import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchGroup } from '../../../redux/actions/group-actions';
import { deletePrincipalsFromGroup } from '../../../helpers/group/group-helper';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../../helpers/shared/pagination';
import { Button, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import AddGroupMembers from './edit-group-members';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPrincipals = ({ uuid, fetchGroup, principals, pagination }) => {
  const [ filterValue, setFilterValue ] = useState('');

  const fetchData = (setRows) => {
    if (uuid) {
      fetchGroup(uuid).then((data) => {
        console.log('Debug - createRows principal list: ', data);
        setRows(createRows(data.value.principals, filterValue));
      });
    }
  };

  const removeMember = (userNames) => {
    return deletePrincipalsFromGroup(uuid, userNames);
  };

  const routes = () => <Fragment>
    <Route exact path={ `/groups/detail/${uuid}/add_members` } component={ AddGroupMembers } />
  </Fragment>;

  const actionResolver = (_principalData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, principal) => {
            console.log('Debug - principal, event', principal, _event);
            removeMember([ principal.username ]);
          }
        }
      ];

  const toolbarButtons = () => <ToolbarGroup>
    <ToolbarItem>
      <Link to={ `/groups/detail/${uuid}/add_members` }>
        <Button
          variant="primary"
          aria-label="Add member"
        >
          Add member
        </Button>
      </Link>
    </ToolbarItem>
  </ToolbarGroup>;

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid &&
      <TableToolbarView
        data={ principals }
        isSelectable={ true }
        createRows={ createRows }
        columns={ columns }
        fetchData={ fetchData }
        request={ fetchGroup }
        routes={ routes }
        actionResolver={ actionResolver }
        titlePlural="principals"
        titleSingular="principal"
        pagination={ pagination }
        filterValue={ filterValue }
        setFilterValue={ setFilterValue }
        toolbarButtons = { toolbarButtons }
      /> }
    </Fragment>);
};

const mapStateToProps = ({ groupReducer: { selectedGroup, isLoading }}) => ({
  principals: selectedGroup.principals,
  pagination: { ...defaultSettings, count: selectedGroup.principals.length },
  isLoading
});

const mapDispatchToProps = dispatch => {
  return {
    fetchGroup: apiProps => dispatch(fetchGroup(apiProps))
  };
};

GroupPrincipals.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  principals: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  fetchGroup: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  match: PropTypes.object,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  })
};

GroupPrincipals.defaultProps = {
  principals: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPrincipals);
