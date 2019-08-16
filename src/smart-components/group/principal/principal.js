import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchGroup } from '../../../redux/actions/group-actions';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members' ];

const GroupPrincipals = ({ uuid, fetchGroup, pagination, history }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ isFetching, setFetching ] = useState(true);
  const [ principals, setPrincipals ] = useState([]);
  console.log('DEBUG GroupPrincipals for : ', uuid);

  const fetchData = async (setRows) => {
    setFetching(true);
    const group = await fetchGroup(uuid);
    console.log('DEBUG group Data : ', group);
    setPrincipals(group.principals);
    setRows(createRows(group.members));
    setFetching(false);
  };

  useEffect(() => {
    if (uuid) { fetchData();}
  }, [ uuid ]);

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
      { isFetching ?  <ListLoader/> :
        <TableToolbarView
          data={ principals }
          createRows={ createRows }
          columns={ columns }
          fetchData={ fetchData }
          request={ fetchGroup }
          actionResolver={ actionResolver }
          titlePlural="principals"
          titleSingular="principal"
          pagination={ pagination }
          filterValue={ filterValue }
          setFilterValue={ setFilterValue }
        /> }
    </Fragment>);
};

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
  uuid: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

GroupPrincipals.defaultProps = {
  principals: [],
  pagination: {}
};

export default connect(null, mapDispatchToProps)(GroupPrincipals);
