import { UseFieldApiConfig, useFieldApi, useFormApi } from '@data-driven-forms/react-form-renderer';
import { FormGroup } from '@patternfly/react-core';
import { DataView, DataViewTable, DataViewToolbar } from '@patternfly/react-data-view';
import React from 'react';

const EditPermissionsTable: React.FC = () => {
  return <DataView>
    <DataViewToolbar />
    <DataViewTable
        columns={['Application', 'Resource Type', 'Operation']}
        rows={[]}
    />
  </DataView>;
};

interface ExtendedUseFieldApiConfig extends UseFieldApiConfig {
  roleId?: string;
}

export const EditRolePermissions: React.FC<ExtendedUseFieldApiConfig> = (props) => {
  const formOptions = useFormApi();
  const { input, roleId } = useFieldApi(props);
  return (
    <React.Fragment>
      <FormGroup label="Select permissions" fieldId="role-permissions">
        <EditPermissionsTable />
      </FormGroup>
    </React.Fragment>
  );
};
