import React, { useState } from 'react';
import { Wizard } from '@patternfly/react-core';
import AddRolePermissionView from './add-role-permission-view';
import { WarningModal } from '../../common/warningModal';

import { useHistory } from 'react-router-dom';

const AddRolePermissionWizard = () => {
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);

  const steps = [
    {
      id: 1,
      name: 'Add Permissions',
      component: <AddRolePermissionView />,
    },
    {
      id: 2,
      name: 'Review Details',
      component: <h4>We are ready to go</h4>,
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

export default AddRolePermissionWizard;
