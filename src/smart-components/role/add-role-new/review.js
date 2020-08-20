/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import {
    Stack,
    StackItem,
    Grid,
    GridItem,
    Text,
    TextContent,
    TextVariants
} from '@patternfly/react-core';
import {
    Table,
    TableHeader,
    TableBody,
    TableVariant
} from '@patternfly/react-table';

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

const ReviewStep = (props) => {
    const { input } = useFieldApi(props);
    const formOptions = useFormApi();
    const {
        'role-name': name,
        'role-description': description,
        'add-permissions-table': permissions
    } = formOptions.getState().values;
    const columns = [ 'Application', 'Resource type', 'Operation' ];
    const rows = permissions.map(permission => ({
        cells: permission.uuid.split(':')
    }));

    return <React.Fragment>
        <Stack hasGutter>
            <StackItem>
                <TextContent>
                    <Text component={ TextVariants.p }>Review and confirm the details for your role, or click Back to revise.</Text>
                </TextContent>
            </StackItem>
            <StackItem className="ins-c-rbac__summary">
                <Grid hasGutter>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } style={ { 'font-weight': 'bold' } }>Name</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Text component={ TextVariants.p }>{name}</Text>
                    </GridItem>
                </Grid>
                <Grid hasGutter>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } style={ { 'font-weight': 'bold' } }>Description</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Text component={ TextVariants.p }>{description}</Text>
                    </GridItem>
                </Grid>
                <Grid hasGutter>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } style={ { 'font-weight': 'bold' } }>Permissions</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Table
                            aria-label="Simple Table"
                            cells={ columns }
                            rows={ rows }
                            variant={ TableVariant.compact }
                            isStickyHeader
                        >
                            <TableHeader />
                            <TableBody />
                        </Table>
                    </GridItem>
                </Grid>
                <Grid hasGutter>
                    <GridItem span={ 2 }>
                        <Text component={ TextVariants.h4 } style={ { 'font-weight': 'bold' } }>Resource definitions</Text>
                    </GridItem>
                    <GridItem span={ 10 }>
                        <Table
                            aria-label="Simple Table"
                            cells={ [ 'Permission', 'Resource definitions' ] }
                            rows={ mockData }
                            variant={ TableVariant.compact }
                            isStickyHeader
                        >
                            <TableHeader />
                            <TableBody />
                        </Table>
                    </GridItem>
                </Grid>
            </StackItem>
        </Stack>
    </React.Fragment>;
};

export default ReviewStep;
