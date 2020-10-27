import React, { useState, useEffect } from 'react';
import { Wizard } from '@patternfly/react-core';
import AddRolePermissionView from './add-role-permission-view';
import { WarningModal } from '../../common/warningModal';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
// import { updateRole } from '../../../redux/actions/role-actions';
// import RolePermissionSummaryContent from './add-role-permission-summary-content';

const AddRolePermissionWizard = ({ role }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  // const [formData, setFormData] = useState({});

  useEffect(() => {
    console.log('+++____ Trying to figure out where my error is: ', selectedPermissions);
    console.log('====== trying to figure out my set: ', setSelectedPermissions);
    console.log('269 ---- Probando lo que tengo como role en add-role-wizard: ', role);
  }, []);

  const steps = [
    {
      id: 1,
      name: 'Add Permissions',
      component: new AddRolePermissionView({ selectedPermissions, setSelectedPermissions, role }),
    },
    {
      id: 2,
      name: 'Review Details',
      component: <h3>Traimelo completo bb</h3>,
      nextButtonText: 'Confirm',
    },
  ];

  const history = useHistory();

  const handleWizardCancel = () => {
    setCancelWarningVisible(true);
  };

  const handleConfirmCancel = () => {
    history.goBack();
  };

  // const onSubmit = () => {
  //   const roleData ={
  //     ...formData,
  //   }
  // }

  return (
    <>
      <Wizard title="Add Permission" description="Adding permissions to roles" steps={steps} isOpen={true} onClose={handleWizardCancel} />
      <WarningModal
        type="Permission"
        isOpen={cancelWarningVisible}
        onModalCancel={() => setCancelWarningVisible(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </>
  );
};

AddRolePermissionWizard.defaultProps = {
  role: {},
};

AddRolePermissionWizard.propTypes = {
  role: PropTypes.object,
};

export default AddRolePermissionWizard;
