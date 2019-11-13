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
import { defaultSettings } from '../../../helpers/shared/pagination';
import { Button } from '@patternfly/react-core';
import AddGroupMembers from './add-group-members';
import { Section } from '@redhat-cloud-services/frontend-components';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPrincipals = ({
  match: { params: { uuid }},
  fetchGroup,
  removeMembersFromGroup,
  pagination,
  principals,
  isLoading
}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedPrincipals, setSelectedPrincipals ] = useState([]);

  const fetchData = () => {
    fetchGroup(uuid);
  };

  const setCheckedPrincipals = (newSelection) => {
    setSelectedPrincipals((principals) => newSelection(principals));
  };

  const removeMembers = (userNames) => {
    return removeMembersFromGroup(uuid, userNames).then(() => { setSelectedPrincipals([]); fetchData();});
  };

  const actionResolver = (_principalData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)' },
          onClick: (_event, _rowId, principal) => {
            removeMembers([ principal.username ]);
          }
        }
      ];

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/members/add_members` }
      render={ args => <AddGroupMembers
        fetchData={ fetchData }
        closeUrl={ `/groups/detail/${uuid}/principals` }
        { ...args }
      /> }
    />
  </Fragment>;

  const toolbarButtons = () => [
    <Link
      to={ `/groups/detail/${uuid}/members/add_members` }
      key="remove-from-group"
    >
      <Button
        variant="primary"
        aria-label="Add member"
      >
        Add member
      </Button>
    </Link>,
    {
      label: 'Remove selected',
      props: {
        isDisabled: !selectedPrincipals || !selectedPrincipals.length > 0,
        variant: 'danger',
        onClick: () => removeMembers(selectedPrincipals)
      }
    }
  ];

  return (
    <Section type="content" id={ 'tab-principals' }>
      <TableToolbarView
        data={ principals }
        isSelectable={ true }
        createRows={ createRows }
        columns={ columns }
        request={ fetchGroup }
        routes={ routes }
        actionResolver={ actionResolver }
        titlePlural="principals"
        titleSingular="principal"
        pagination={ pagination }
        filterValue={ filterValue }
        fetchData={ () => fetchGroup(uuid) }
        setFilterValue={ ({ name }) => setFilterValue(name) }
        checkedRows={ selectedPrincipals }
        isLoading={ isLoading }
        setCheckedItems={ setCheckedPrincipals }
        toolbarButtons={ toolbarButtons }
      />
    </Section>
  );
};

const mapStateToProps = ({ groupReducer: { groups }}, { match: { params: { uuid }}}) => {
  const activeGroup = groups.data.find((group) => group.uuid === uuid) || {};
  return {
    principals: (activeGroup.principals || []).map(principal => ({ ...principal, uuid: principal.username })),
    pagination: { ...defaultSettings, count: activeGroup.principals && activeGroup.principals.length },
    isLoading: !activeGroup.loaded
  };
};

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
