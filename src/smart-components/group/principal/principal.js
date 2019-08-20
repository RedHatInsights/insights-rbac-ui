import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchGroup } from '../../../redux/actions/group-actions';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../../helpers/shared/pagination';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPrincipals = ({ uuid, fetchGroup, history }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ principals, setPrincipals ] = useState([]);
  const [ pagination, setPagination ] = useState({});

  const fetchData = (setRows) => {
    if (uuid) {
      fetchGroup(uuid).then((data) => {
        setPrincipals(data.value.principals);
        setRows(createRows(data.value.principals, filterValue));
        setPagination({ ...pagination, count: data.value.principals.length });
      });
    }
  };

  const actionResolver = (_principalData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, principal) =>
            history.push(`/principals/edit/${principal.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, principal) =>
            history.push(`/principals/remove/${principal.uuid}`)
        }
      ];

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid &&
      <TableToolbarView
        data={ principals }
        createRows={ createRows }
        columns={ columns }
        fetchData={ fetchData }
        request={ fetchGroup }
        actionResolver={ actionResolver }
        titlePlural="principals"
        titleSingular="principal"
        filterValue={ filterValue }
        setFilterValue={ setFilterValue }
        pagination={ pagination }
      /> }
    </Fragment>);
};

const mapStateToProps = ({ groupReducer: { filterValue }}) => ({
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchGroup: apiProps => dispatch(fetchGroup(apiProps))
  };
};

GroupPrincipals.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  principals: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchGroup: PropTypes.func.isRequired,
  uuid: PropTypes.string,
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
