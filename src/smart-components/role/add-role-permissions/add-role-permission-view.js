import React, { useState, useEffect } from 'react';
// import { usePermissions } from '@redhat-cloud-services/frontend-components-utilities/files/RBACHook';

// This component takes care of pulling down active permissions available to be added to the current role in focus. 
const AddRolePermissionView = () => {
  const [flag, setFlag] = useState(true);
  console.log('Testing out my flag in add-role-permission-view!', flag);

  useEffect(() => {
    setFlag(false);
  }, []);

  return (
    <div>
      <h1>Hello</h1>
    </div>
  );
};

export default AddRolePermissionView;
