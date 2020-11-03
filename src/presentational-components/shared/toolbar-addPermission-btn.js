import React from 'react';
import { routes as paths } from '../../../package.json';
import { Button } from '@patternfly/react-core'; 
import { Link } from 'react-router-dom';

const toolbarAddPermissionBtn = () => {userEntitlements?.cost_management ? (
    <Link path={paths['role-add-permission']} key='role-add-permission'>
        <Button variant='primary'>Add Permission</Button>
    </Link>) : <Fragment />
}

export default toolbarAddPermissionBtn;
