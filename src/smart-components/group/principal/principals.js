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
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';
import { mappedProps } from '../../../helpers/shared/helpers';

const debouncedFetch = debouncePromise(callback => callback());

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPrincipals = ({
  match: { params: { uuid }},
  fetchGroup,
  removeMembersFromGroup,
  pagination,
  principals
}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedPrincipals, setSelectedPrincipals ] = useState([]);

  const fetchData = () => {
    if (uuid) {
      fetchGroup(uuid);
    }
  };

  const setCheckedPrincipals = (event, isSelected, _rowId, { username } = {}) => {
    setSelectedPrincipals((selected) => {
      let currRows = [ username ];
      if (typeof event === 'number') {
        if (event === -1) {
          return [];
        }

        currRows = principals.map(({ username }) => username);
      }

      if (!isSelected) {
        return selected.filter((row) => !currRows.find((username) => username === row));
      } else {
        return [
          ...selected,
          ...currRows
        ].filter((row, key, arr) => arr.findIndex((username) => row === username) === key);
      }
    });
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
  const removeMembers = (userNames) => {
    return removeMembersFromGroup(uuid, userNames).then(() => { setCheckedPrincipals([]); fetchData();});
  };

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/members/add_members` }
      render={ args => <AddGroupMembers fetchData={ fetchData } closeUrl={ `/groups/detail/${uuid}/principals` } { ...args }/> }/>
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
        isDisabled: !selectedPrincipals.length > 0,
        variant: 'danger',
        onClick: () => removeMembers(selectedPrincipals)
      }
    }
  ];

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid && <Section type="content" id={ 'tab-principals' }>
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
          setFilterValue={ (config, isDebounce) => {
            setFilterValue(config.name);
            if (isDebounce) {
              debouncedFetch(() => fetchGroup(mappedProps(config)));
            } else {
              fetchGroup(mappedProps(config));
            }
          } }
          checkedRows={ selectedPrincipals }
          setCheckedItems={ setCheckedPrincipals }
          toolbarButtons = { toolbarButtons }
        />
      </Section> }
    </Fragment>);
};

const mapStateToProps = ({ groupReducer: { groups, isLoading }}, { match: { params: { uuid }}}) => {
  const activeGroup = groups.data.find((group) => group.uuid === uuid) || {};
  return {
    principals: (activeGroup.principals || []).map(principal => ({ ...principal, uuid: principal.username })),
    pagination: { ...defaultSettings, count: activeGroup.principals && activeGroup.principals.length },
    isLoading
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
