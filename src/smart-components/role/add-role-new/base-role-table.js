import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Radio } from '@patternfly/react-core';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesForWizard } from '../../../redux/actions/role-actions';
import { mappedProps } from '../../../helpers/shared/helpers';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

const columns = [ '', 'Name', 'Description' ];
const selector = ({ roleReducer: { rolesForWizard, isLoading }}) => ({
    roles: rolesForWizard.data,
    pagination: rolesForWizard.meta,
    isLoading
});

const BaseRoleTable = (props) => {

    const dispatch = useDispatch();
    const fetchData = (options) => dispatch(fetchRolesForWizard(options));
    const [ filterValue, setFilterValue ] = useState('');
    const [ baseRole, setBaseRole ] = useState({});
    const { roles, pagination } = useSelector(selector, shallowEqual);
    const { input } = useFieldApi(props);
    const formOptions = useFormApi();

    useEffect(()=> {
        setBaseRole(input.value);
        fetchData({
            limit: 50,
            offset: 0,
            itemCount: 0
        });
    }, []);

    const createRows = (roles) => roles.map(
        role => ({
            cells: [
                {
                    title: <Radio
                        id={ `${role.uuid}-radio` }
                        name={ `${role.name}-radio` }
                        aria-label={ `${role.name}-radio` }
                        value={ role.uuid }
                        isChecked={ baseRole.uuid === role.uuid }
                        onChange={ () => {
                            setBaseRole(role);
                            input.onChange(role);
                            formOptions.change('role-copy-name', `Copy of ${role.name}`);
                            formOptions.change('role-copy-description', role.description);
                        } }
                    />
                },
                role.name,
                role.description
            ]
        })
    );
    return <div>
        <TableToolbarView
                    columns={ columns }
                    createRows={ createRows }
                    data={ roles }
                    fetchData={ (config) => fetchData(mappedProps(config)) }
                    filterValue={ filterValue }
                    setFilterValue={ ({ name }) => setFilterValue(name) }
                    isLoading={ false }
                    pagination={ pagination }
                    titlePlural="roles"
                    titleSingular="role"
                    filterPlaceholder="role name"
                    isCompact
                />
    </div>;
};

export default BaseRoleTable;
