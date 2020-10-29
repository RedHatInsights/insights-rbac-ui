import React, { useState, useEffect } from 'react';
import { Wizard } from '@patternfly/react-core';
import AddRolePermissionView from './add-role-permission-view';
import AddRolePermissionSummaryContent from './add-role-permissions-summary-content';
import { WarningModal } from '../../common/warningModal';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { updateRole } from '../../../helpers/role/role-helper';

const AddRolePermissionWizard = ({ role }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [currentRoleID, setCurrentRoleID] = useState('');

  const setSelectedRolePermissions = (selected) => {
    setSelectedPermissions(selected);
  };

  useEffect(() => {
    console.log('ME CAMBIO EL SELECTED:', selectedPermissions);
    console.log('300: Trying to see the role: ', role);
    setCurrentRoleID(role.uuid);
  }, [selectedPermissions]);

  const steps = [
    {
      id: 1,
      name: 'Add Permissions',
      component: new AddRolePermissionView({ selectedPermissions, setSelectedRolePermissions, role }),
    },
    {
      id: 2,
      name: 'Review Details',
      component: new AddRolePermissionSummaryContent({ selectedPermissions, role }),
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

  const onSubmit = async () => {
    const newPermissions = { ...role.access, ...selectedPermissions };
    const roleData = {
      ...role,
      access: newPermissions,
    };
    console.log('301 Trying to see the data: ', roleData);
    try {
      await updateRole(currentRoleID, roleData);
    } catch (e) {
      console.log('Error trying to update role with added permissions: ', e);
    }
  };

  return (
    <>
      <Wizard title="Add Permission" description="Adding permissions to roles" steps={steps} isOpen={true} onClose={handleWizardCancel} />
      <WarningModal
        type="Permission"
        isOpen={cancelWarningVisible}
        onModalCancel={() => setCancelWarningVisible(false)}
        onConfirmCancel={handleConfirmCancel}
        onSave={onSubmit}
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
