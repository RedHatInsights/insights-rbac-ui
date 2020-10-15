import React, { useState } from 'react';
import { Wizard } from '@patternfly/react-core';
// import { WarningModal } from  '../../common/warningModal';
import '../../common/hideWizard.scss';
// import SummaryContent from '../../group/add-group/summary-content';
// import { usePermissions } from '@redhat-cloud-services/frontend-components-utilities/files/RBACHook';
import AddRolePermissionView from './add-role-permission-view';
import PropTypes from 'prop-types';
// import '../../common/hideWizard.scss';
import { useHistory } from 'react-router-dom';

const AddRolePermissionWizard = ({ isOpen }) => {
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

  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const history = useHistory();

  const onModalClose = () => {
    setIsModalOpen(!isModalOpen);
    history.goBack();
  };

  return (
    <>
      <Wizard title="Add Permission" description="Adding permissions to roles" steps={steps} isOpen={isModalOpen} onClose={onModalClose} />
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
