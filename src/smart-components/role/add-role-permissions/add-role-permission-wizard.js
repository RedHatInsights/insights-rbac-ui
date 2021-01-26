/* eslint-disable */
import React, { useState, useEffect } from 'react';
import AddRolePermissionView from './add-role-permission-view';
import AddRolePermissionSummaryContent from './add-role-permissions-summary-content';
import AddRolePermissionSuccess from './add-role-permission-success';
import PropTypes from 'prop-types';
import { WarningModal } from '../../common/warningModal';
import { useHistory } from 'react-router-dom';
import { Wizard } from '@patternfly/react-core';
import { updateRole } from '../../../helpers/role/role-helper';

const AddRolePermissionWizard = ({ role }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);
  const [currentRoleID, setCurrentRoleID] = useState('');
  const ARRAY_MINIMUM = 0;
  const history = useHistory();

  useEffect(() => {
    setCurrentRoleID(role.uuid);
    console.log('THIS IS MY CURRENT ID: ', currentRoleID);
    console.log('THIS IS MY CURRENT ROLE: ', role.uuid);
  });

  const setSelectedRolePermissions = (selected) => {
    setSelectedPermissions(selected);
  };

  const steps = [
    {
      id: 1,
      name: 'Add permissions',
      component: new AddRolePermissionView({ selectedPermissions, setSelectedRolePermissions, role }),
    },
    {
      id: 2,
      name: 'Review details',
      component: new AddRolePermissionSummaryContent({ selectedPermissions, role }),
      nextButtonText: 'Save',
    },
    {
      id: 3,
      name: 'Success',
      component: new AddRolePermissionSuccess({ currentRoleID }),
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
      console.log('TESTING OUT MY ROLE BEFORE UPDATE: ', currentRoleID);
      await updateRole(currentRoleID, roleData);
      history.goBack();
    } catch (e) {
      history.goBack();
    }
  };

  return (
    <>
      <Wizard
        title="Add permissions"
        description="Adding permissions to roles"
        steps={steps}
        isOpen={true}
        onClose={() => selectedPermissions.length > ARRAY_MINIMUM ? handleWizardCancel() : handleConfirmCancel()}
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
