// export const asyncValidator = async (value, sourceId = undefined) => {
//     let response;
//     try {
//         response = await findSource(value);
//     } catch (error) {
//         console.error(handleError(error));
//         return undefined;
//     }

//     if (response.data.sources.find(({ id }) => id !== sourceId)) {
//         throw 'Name has already been taken';
//     }

//     return undefined;
// };

export default {
    fields: [
        {
            component: 'wizard',
            name: 'wizzard',
            isDynamic: true,
            inModal: true,
            showTitles: true,
            title: 'Create role',
            fields: [
                {
                    title: 'Create role',
                    name: 'step-1',
                    nextStep: {
                        when: 'role-type',
                        stepMapper: {
                            copy: 'name-and-description',
                            create: 'add-permissions'
                        }
                    },
                    fields: [
                        {
                            component: 'radio',
                            name: 'role-type',
                            isRequired: true,
                            options: [
                                {
                                    label: 'Create a role from scratch',
                                    value: 'create'
                                },
                                {
                                    label: 'Copy an existing role',
                                    value: 'copy'
                                }
                            ],
                            validate: [
                                {
                                    type: 'required'
                                }
                            ]
                        },
                        {
                            component: 'text-field',
                            name: 'role-name',
                            type: 'text',
                            label: 'Role name',
                            isRequired: true,
                            condition: {
                                when: 'role-type',
                                is: 'create'
                            },
                            validate: [
                                {
                                    type: 'required'
                                }
                            ]
                        },
                        {
                            component: 'text-field',
                            name: 'role-description',
                            type: 'text',
                            label: 'Role description',
                            condition: {
                                when: 'role-type',
                                is: 'create'
                            }
                        },
                        {
                            component: 'base-role-table',
                            name: 'base-role',
                            label: 'Base role',
                            isRequired: true,
                            condition: {
                                when: 'role-type',
                                is: 'copy'
                            },
                            validate: [
                                {
                                    type: 'required'
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Name and description',
                    name: 'name-and-description',
                    fields: [
                        {
                            component: 'text-field',
                            name: 'role-name',
                            type: 'text',
                            label: 'Role name',
                            isRequired: true,
                            validate: [
                                {
                                    type: 'required'
                                }
                            ]
                        },
                        {
                            component: 'text-field',
                            name: 'role-description',
                            type: 'text',
                            label: 'Role description'
                        }
                    ]
                },
                {
                    name: 'add-permissions',
                    title: 'Add permissions',
                    fields: [
                    ]
                }
            ]
        }
    ]
};
