import React, { useState, useEffect } from 'react';
import AddRolePermissionView from './add-role-permission-view';
import AddRolePermissionSummaryContent from './add-role-permissions-summary-content';
import PropTypes from 'prop-types';
import { WarningModal } from '../../common/warningModal';
import { useHistory } from 'react-router-dom';
import { Wizard } from '@patternfly/react-core';
import { updateRole } from '../../../helpers/role/role-helper';

const AddRolePermissionWizard = ({ role }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState({});
  const [currentRoleID, setCurrentRoleID] = useState('');
  const history = useHistory();

  const setSelectedRolePermissions = (selected) => {
    setSelectedPermissions(selected);
  };

  useEffect(() => {
    setCurrentRole(role);
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

  const handleWizardCancel = () => {
    setCancelWarningVisible(true);
  };

  const handleConfirmCancel = () => {
    history.goBack();
  };

  const onSubmit = async () => {
    const cleanPermissions = selectedPermissions.map((permission) => {
      // don't have info on how we populate resourceDefinitions
      return { resourceDefinitions: [], permission: permission.uuid };
    });

    const roleData = {
      ...role,
      access: [...role.access, ...cleanPermissions],
      accessCount: role.accessCount + selectedPermissions.length,
    };

    try {
      console.log('Trying to get my currentRoleID: ', currentRoleID);
      console.log('Trying to get my currentRole: ', currentRole);
      console.log('Trying to get my roleData: ', roleData);
      const response = await updateRole(currentRoleID, roleData);
      console.log('Try the response: ', response);
      history.goBack();
    } catch (e) {
      console.log('Error trying to update role with added permissions: ', e);
      console.log('We have to make sure we understand what role is: ', role);
      history.goBack();
    }
  };

  return (
    <>
      <Wizard
        title="Add Permission"
        description="Adding permissions to roles"
        steps={steps}
        isOpen={true}
        onClose={handleWizardCancel}
        onSave={onSubmit}
      />
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
