import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import {
    Stack,
    StackItem,
    Grid,
    GridItem,
    Text,
    TextVariants
} from '@patternfly/react-core';
import './review.scss';

const mockData = [
    { cells: [ 'cost:aws.account:read', 'Project 1' ]},
    { cells: [ 'cost:azure:read', 'Cluster 1, Cluster 2, Cluster 3' ]},
    { cells: [ 'cost:aws.account:write', 'Project 1' ]},
    { cells: [ 'cost:aws.account:execute', 'Project 1' ]},
    { cells: [ 'cost:aws:something', 'Project 1' ]},
    { cells: [ 'cost:aws:something2', 'Project 2' ]},
    { cells: [ 'cost:aws:something3', 'Project 3' ]},
    { cells: [ 'cost:aws:something4', 'Project 4' ]},
    { cells: [ 'cost:aws:something5', 'Project 5' ]},
    { cells: [ 'cost:aws:something6', 'Project 6' ]},
    { cells: [ 'cost:aws:something7', 'Project 7' ]},
    { cells: [ 'cost:aws:something8', 'Project 8' ]},
    { cells: [ 'cost:aws:something9', 'Project 9' ]},
    { cells: [ 'cost:aws:something10', 'Project 10' ]},
    { cells: [ 'cost:aws:something11', 'Project 11' ]},
    { cells: [ 'cost:aws:something12', 'Project 12' ]}
];

const stickyTable = (columns, rows) => (
    <div className='ins-c-rbac__sticky'>
        <Grid className="title">
            {columns.map(col => <GridItem  span={ 12 / columns.length } key={ col }>{col}</GridItem>)}
        </Grid>
        <Grid className='data'>
            {rows.map(row => (
                row.cells.map(cell => <GridItem span={ 12 / columns.length  } key={ cell }>{cell}</GridItem>)
            ))}
        </Grid>
    </div>
);

const ReviewStep = () => {
    const formOptions = useFormApi();
    const {
        'role-name': name,
        'role-description': description,
        'role-copy-name': copyName,
        'role-copy-description': copyDescription,
        'add-permissions-table': permissions
    } = formOptions.getState().values;
    const columns = [ 'Application', 'Resource type', 'Operation' ];
    const rows = permissions.map(permission => ({
        cells: permission.uuid.split(':')
    }));

    return <React.Fragment>
        <Stack hasGutter>
            <StackItem className="ins-c-rbac__summary">
                <Grid>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } className='ins-c-rbac__bold-text'>Name</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Text component={ TextVariants.p }>{name || copyName}</Text>
                    </GridItem>
                </Grid>
                <Grid>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } className='ins-c-rbac__bold-text'>Description</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Text component={ TextVariants.p }>{description || copyDescription}</Text>
                    </GridItem>
                </Grid>
                <Grid>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } className='ins-c-rbac__bold-text'>Permissions</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        {stickyTable(columns, rows)}
                    </GridItem>
                </Grid>
                <Grid>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } className='ins-c-rbac__bold-text'>Resource definitions</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        {stickyTable([ 'Permission', 'Resource definitions' ], mockData)}
                    </GridItem>
                </Grid>
            </StackItem>
        </Stack>
    </React.Fragment>;
};

export default ReviewStep;
