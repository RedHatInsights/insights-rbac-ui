import React, { useState, useEffect } from 'react';
import { Wizard } from '@patternfly/react-core';
import { WarningModal } from '../../common/warningModal';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import '../../common/hideWizard.scss';
// import SummaryContent from '../../group/add-group/summary-content';
import { usePermissions } from '@redhat-cloud-services/frontend-components-utilities/files/RBACHook';
import AddRolePermissionView from './add-role-permission-view';
import PropTypes from 'prop-types';
// import '../../common/hideWizard.scss';
import { useHistory } from 'react-router-dom';

const AddRolePermissionWizard = () => {
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

  const { data } = usePermissions('catalog', ['catalog: *']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [availPermissions, setAvailPermissions] = useState([]);
  // const [permissionData, setPermissionData] = useState({});
  // const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const history = useHistory();

  useEffect(() => {
    console.log('!@#$!@#$!@#$!@#$!$ DATA IN EK WIZARD BRO:');
  }, []);

  const onModalClose = () => {
    setIsModalOpen(!isModalOpen);
    history.goBack();
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding Permission to Role',
      dismissDelay: 8000,
      dismissable: false,
      description: 'Adding permission was canceled.',
    });
    history.push('/roles');
  };

  return (
    <>
      <Wizard title="Add Permission" description="Adding permissions to roles" steps={steps} isOpen={true} onClose={onModalClose} />
      {console.log('DATA IN WIZARD:', data)}
      <WarningModal type="group" isOpen={isModalOpen} onModalCancel={() => setIsModalOpen(false)} onConfirmCancel={onCancel} />
    </>
  );
};

AddRolePermissionWizard.propTypes = {
  isOpen: PropTypes.bool,
};

AddRolePermissionWizard.defaultProps = {
  isOPen: true,
};

export default AddRolePermissionWizard;
