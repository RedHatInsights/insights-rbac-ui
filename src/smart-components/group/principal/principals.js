import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchGroup } from '../../../redux/actions/group-actions';
import { removeMembersFromGroup, addMembersToGroup } from '../../../redux/actions/group-actions';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../../helpers/shared/pagination';
import { Button, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import AddGroupMembers from './add-group-members';
import { PrincipalsActionsDropdown } from './principal_action_dropdown';
import { Section } from '@redhat-cloud-services/frontend-components';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPrincipals = ({ match: { params: { uuid }}, fetchGroup, removeMembersFromGroup, pagination }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedPrincipals, setSelectedPrincipals ] = useState([]);
  const [ principals, setPrincipals ] = useState([]);

  const fetchData = () => {
    if (uuid) {
      fetchGroup(uuid).then((data) => {
        setPrincipals(data.value.principals);
      });
    }
  };

  const setCheckedPrincipals = (checkedPrincipals) =>
    setSelectedPrincipals(checkedPrincipals.map(user => user.username));

  const anyPrincipalsSelected = () => selectedPrincipals.length > 0;

  const removeMembers = (userNames) => {
    return removeMembersFromGroup(uuid, userNames).then(() => { setCheckedPrincipals([]); fetchData();});
  };

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/members/add_members` }
      render={ args => <AddGroupMembers fetchData={ fetchData } closeUrl={ `/groups/detail/${uuid}/principals` } { ...args }/> }/>
  </Fragment>;

  const actionResolver = (_principalData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, principal) => {
            removeMembers([ principal.username ]);
          }
        }
      ];

  const toolbarButtons = () =>
    <ToolbarGroup>
      <ToolbarItem>
        <Link to={ `/groups/detail/${uuid}/members/add_members` }>
          <Button
            variant="primary"
            aria-label="Add member"
          >
          Add member
          </Button>
        </Link>
      </ToolbarItem>
      <ToolbarItem>
        <PrincipalsActionsDropdown itemAction={ removeMembers }
          anyItemsSelected={ anyPrincipalsSelected() }
          groupId ={ uuid }
          itemsSelected={ selectedPrincipals } />
      </ToolbarItem>
    </ToolbarGroup>;

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid && <Section type="content" id={ 'tab-principals' }>
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
          setCheckedItems={ setCheckedPrincipals }
          toolbarButtons = { toolbarButtons }
        />
      </Section> }
    </Fragment>);
};

const mapStateToProps = ({ groupReducer: { selectedGroup, isLoading }}) => ({
  principals: selectedGroup.principals,
  pagination: { ...defaultSettings, count: selectedGroup.principals.length },
  isLoading
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroup,
  addMembersToGroup,
  removeMembersFromGroup
}, dispatch);

GroupPrincipals.propTypes = {
  principals: PropTypes.array,
  isLoading: PropTypes.bool,
  fetchGroup: PropTypes.func.isRequired,
  removeMembersFromGroup: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired }).isRequired,
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
