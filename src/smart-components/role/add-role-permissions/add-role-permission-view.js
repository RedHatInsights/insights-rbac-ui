import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { listPermissions } from '../../../redux/actions/permission-action';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';
import { fetchRole } from '../../../redux/actions/role-actions';

const columns = [{ title: 'Application' }, { title: 'Resource type' }, { title: 'Operation' }];

// This component takes care of pulling down active permissions available to be added to the current role in focus.
const AddRolePermissionView = ({ currentRole }) => {
  const dispatch = useDispatch();
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionsOptions(apiProps));
  const { permissions, isLoading, pagination, applicationOptions, resourceOpptions, operationOptions } = useSelector(selector, shallowEqual);
  const [filters, setFilters] = useState({ applications: [], resources: [], ooperations: [] });
  console.log('Testing out my flag in add-role-permission-view!', flag);

  useEffect(() => {
    setFlag(false);
    console.log('Starting to get my data together: ');
  }, []);



  return (
    <h1>Still trying</h1>
  );
};

// const mapStateToProps = ({});

AddRolePermissionView.propTypes = {
  currentRole: PropTypes.object,
};

export default AddRolePermissionView;
