import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Radio } from '@patternfly/react-core/dist/dynamic/components/Radio';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import { fetchRolesForWizard } from '../../../redux/roles/actions';
import { mappedProps } from '../../../helpers/dataUtilities';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { sortable } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const selector = ({ roleReducer: { rolesForWizard, isWizardLoading } }) => ({
  roles: rolesForWizard.data,
  pagination: rolesForWizard.meta,
  isWizardLoading,
});

const BaseRoleTable = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const fetchData = (options) => dispatch(fetchRolesForWizard(options));
  const [filterValue, setFilterValue] = useState('');
  const { roles, pagination, isWizardLoading } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const columns = [
    { title: '' },
    { title: intl.formatMessage(messages.name), key: 'display_name', transforms: [sortable] },
    { title: intl.formatMessage(messages.description) },
  ];

  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;

  useEffect(() => {
    fetchData({
      limit: 50,
      offset: 0,
      itemCount: 0,
      orderBy,
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
                  formOptions.change('not-allowed-permissions', []);
                });
              }}
            />
          ),
          props: { className: 'pf-v5-c-table__check' },
        },
        role.display_name || role.name,
        role.description,
      ],
    }));
  return (
    <div>
      <Alert variant="info" isInline title={intl.formatMessage(messages.granularPermissionsWillBeCopied)} />
      <TableToolbarView
        columns={columns}
        rows={createRows(roles)}
        data={roles}
        fetchData={(config) => {
          fetchData(mappedProps(config));
        }}
        filterValue={filterValue}
        setFilterValue={({ name }) => setFilterValue(name)}
        isLoading={isWizardLoading}
        sortBy={sortByState}
        onSort={(e, index, direction) => {
          const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index].key}`;
          setSortByState({ index, direction });
          fetchData({
            ...pagination,
            offset: 0,
            orderBy,
          });
        }}
        pagination={pagination}
        titlePlural={intl.formatMessage(messages.roles)}
        titleSingular={intl.formatMessage(messages.role)}
        filterPlaceholder={intl.formatMessage(messages.roleName).toLowerCase()}
        ouiaId="roles-table"
        isCompact
        tableId="base-role"
      />
    </div>
  );
};

export default BaseRoleTable;
