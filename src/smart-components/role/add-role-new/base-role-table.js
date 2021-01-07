import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Radio, Alert } from '@patternfly/react-core';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesForWizard } from '../../../redux/actions/role-actions';
import { mappedProps } from '../../../helpers/shared/helpers';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/esm/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import { sortable } from '@patternfly/react-table';

const columns = ['', { title: 'Name', key: 'display_name', transforms: [sortable] }, 'Description'];
const selector = ({ roleReducer: { rolesForWizard, isLoading } }) => ({
  roles: rolesForWizard.data,
  pagination: rolesForWizard.meta,
  isLoading,
});

const BaseRoleTable = (props) => {
  const dispatch = useDispatch();
  const fetchData = (options) => dispatch(fetchRolesForWizard(options));
  const [filterValue, setFilterValue] = useState('');
  const { roles, pagination } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  useEffect(() => {
    fetchData({
      limit: 50,
      offset: 0,
      itemCount: 0,
      orderBy: 'display_name',
    });
  }, []);

  const createRows = (roles) =>
    roles.map((role) => ({
      cells: [
        {
          title: (
            <Radio
              id={`${role.uuid}-radio`}
              name={`${role.name}-radio`}
              aria-label={`${role.name}-radio`}
              ouiaId={`${role.name}-radio`}
              value={role.uuid}
              isChecked={input.value.uuid === role.uuid}
              onChange={() => {
                formOptions.batch(() => {
                  input.onChange(role);
                  formOptions.change('role-copy-name', `Copy of ${role.display_name || role.name}`);
                  formOptions.change('role-copy-description', role.description);
                  formOptions.change('add-permissions-table', []);
                  formOptions.change('base-permissions-loaded', false);
                });
              }}
            />
          ),
          props: { className: 'pf-c-table__check' },
        },
        role.display_name || role.name,
        role.description,
      ],
    }));
  return (
    <div>
      <Alert
        variant="info"
        isInline
        title={`Only granular permissions will be copied into a custom role \
        (for example, approval:requests:read). Wildcard permissions will not \
        be copied into a custom role (for example, approval:*:read).
        `}
      />
      <TableToolbarView
        columns={columns}
        createRows={createRows}
        data={roles}
        fetchData={(config) => fetchData(mappedProps(config))}
        filterValue={filterValue}
        setFilterValue={({ name }) => setFilterValue(name)}
        isLoading={false}
        pagination={pagination}
        titlePlural="roles"
        titleSingular="role"
        filterPlaceholder="role name"
        ouiaId="roles-table"
        isCompact
      />
    </div>
  );
};

export default BaseRoleTable;
