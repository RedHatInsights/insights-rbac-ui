import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './policy-table-helpers';
import { fetchGroupPolicies } from '../../../redux/actions/policy-actions';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../../helpers/shared/pagination';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Email', 'First name', 'Last name' ];

const GroupPolicies = ({ uuid, fetchGroupPolicies, pagination }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ policies, setPolicies ] = useState([]);

  const fetchData = () => {
    if (uuid) {
      fetchGroupPolicies({ group_uuid: uuid }).then(({ value: { data }}) => setPolicies(data));
    }
  };

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid &&
      <TableToolbarView
        data={ policies }
        createRows={ createRows }
        columns={ columns }
        fetchData={ fetchData }
        request={ fetchGroupPolicies }
        titlePlural="policies"
        titleSingular="policy"
        pagination={ pagination }
        filterValue={ filterValue }
        setFilterValue={ setFilterValue }

      /> }
    </Fragment>);
};

const mapStateToProps = ({ policyReducer: { policies, isLoading }}) => ({
  policies,
  pagination: policies.meta,
  isLoading
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroupPolicies
}, dispatch);

GroupPolicies.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  policies: PropTypes.array,
  isLoading: PropTypes.bool,
  fetchGroupPolicies: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  match: PropTypes.object,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  })
};

GroupPolicies.defaultProps = {
  policies: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPolicies);
