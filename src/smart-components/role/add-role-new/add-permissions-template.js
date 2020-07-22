import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Chip, ChipGroup, Text, TextContent, Title } from '@patternfly/react-core';
import './add-role-wizard.scss';

const AddPermissionTemplate = ({ formFields }) => {
    const [ selectedPermissions, setSelectedPermissions ] = useState([]);

    const addPermissions = formFields[0][0];
    return <React.Fragment>
        { selectedPermissions.length > 0
        ? <div className='ins-c-rbac-seleted-chips'>
        <ChipGroup categoryName='Selected permissions'>
            { /* immutable reverse */}
            {selectedPermissions.reduce((acc, i) => [ i, ...acc ], []).map(({ uuid }) => (
                <Chip key={ uuid } onClick={ () => setSelectedPermissions(selectedPermissions.filter(p => p.uuid !== uuid)) }>
                    {uuid}
                </Chip>
            ))}
        </ChipGroup>
        </div>
        : null
        }
        <Title headingLevel="h1" size="xl" className='ins-c-rbac-add-permission-title'>
            Add permissions
        </Title>
        <TextContent>
            <Text>
                Select permissions to add to your role
            </Text>
        </TextContent>
        {[ [{ ...addPermissions, props: { ...addPermissions.props, selectedPermissions, setSelectedPermissions }}] ] }
    </React.Fragment>;
};

AddPermissionTemplate.propTypes = {
    formFields: PropTypes.array
};

export default AddPermissionTemplate;
