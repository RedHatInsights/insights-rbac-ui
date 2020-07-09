import { accessWrapper } from '../../smart-components/role/add-role-new/add-permissions';

const data = [
    { permission: 'coolApp:coolResource:read' },
    { permission: 'coolApp:coolResource:write' },
    { permission: 'coolApp:coolResource:execute' },
    { permission: 'coolApp:anotherResource:read' },
    { permission: 'coolApp:anotherResource:write' },
    { permission: 'differentApp:firstResource:write' },
    { permission: 'differentApp:firstResource:read' },
    { permission: 'differentApp:firstResource:execute' },
    { permission: 'differentApp:secondResource:read' },
    { permission: 'differentApp:secondResource:write' },
    { permission: 'differentApp:secondResource:execute' },
    { permission: 'duplicate:cat:meow' },
    { permission: 'duplicate:cat:meow' },
    { permission: 'duplicate:coolResource:meow' }
];

const simpleData = [
    { permission: 'coolApp:coolResource:read' }
];

const duplicateData = [
    { permission: 'coolApp:coolResource:read' },
    { permission: 'coolApp:coolResource:read' }
];

describe('Access compose filter', () => {
    describe('Basic functionality with no filter', () => {
        it('should return all data', () => {
            const out = accessWrapper(simpleData);
            expect(out.data).toEqual([
            { application: 'coolApp', resource: 'coolResource', operation: 'read' }
            ]);
        });

        it('should return all unique data', () => {
            const out = accessWrapper(duplicateData);
            expect(out.data).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' }
            ]);
        });

        it('data equals filteredData', () => {
            const out = accessWrapper(duplicateData);
            expect(out.data).toEqual(out.filteredData);
        });

        it('contains all applications', () => {
            const out = accessWrapper(data);
            expect(out.applications).toEqual([ 'coolApp', 'differentApp', 'duplicate' ]);
        });

        it('contains all resources', () => {
            const out = accessWrapper(data);
            expect(out.resources).toEqual([ 'coolResource', 'anotherResource', 'firstResource', 'secondResource', 'cat' ]);
        });

        it('contains all operations', () => {
            const out = accessWrapper(data);
            expect(out.operations).toEqual([ 'read', 'write', 'execute', 'meow' ]);
        });
    });

    describe('Single category filter', () => {
        it('returns all permissions with coolApp application filter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [], operations: []});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'coolApp', resource: 'coolResource', operation: 'write' },
                { application: 'coolApp', resource: 'coolResource', operation: 'execute' },
                { application: 'coolApp', resource: 'anotherResource', operation: 'read' },
                { application: 'coolApp', resource: 'anotherResource', operation: 'write' }
            ]);
        });

        it('returns all permissions with coolResource resource filter', () => {
            const out = accessWrapper(data, { applications: [], resources: [ 'coolResource' ], operations: []});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'coolApp', resource: 'coolResource', operation: 'write' },
                { application: 'coolApp', resource: 'coolResource', operation: 'execute' },
                { application: 'duplicate', resource: 'coolResource', operation: 'meow' }
            ]);
        });

        it('returns all permissions with read operation filter', () => {
            const out = accessWrapper(data, { applications: [], resources: [], operations: [ 'read' ]});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'coolApp', resource: 'anotherResource', operation: 'read' },
                { application: 'differentApp', resource: 'firstResource', operation: 'read' },
                { application: 'differentApp', resource: 'secondResource', operation: 'read' }
            ]);
        });

        it('returns all applications with coolApp filter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [], operations: []});
            expect(out.applications).toEqual([ 'coolApp', 'differentApp', 'duplicate' ]);
        });

        it('returns resources that belongs to coolApp', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [], operations: []});
            expect(out.resources).toEqual([ 'coolResource', 'anotherResource' ]);
        });

        it('returns operations that belongs to coolApp', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [], operations: []});
            expect(out.operations).toEqual([ 'read', 'write', 'execute' ]);
        });

        it('returns applications that have coolResource', () => {
            const out = accessWrapper(data, { applications: [], resources: [ 'coolResource' ], operations: []});
            expect(out.applications).toEqual([ 'coolApp', 'duplicate' ]);
        });

        it('returns all resources', () => {
            const out = accessWrapper(data, { applications: [], resources: [ 'coolResource' ], operations: []});
            expect(out.resources).toEqual([ 'coolResource', 'anotherResource', 'firstResource', 'secondResource', 'cat' ]);
        });

        it('returns operations that belongs to coolResource', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [], operations: []});
            expect(out.operations).toEqual([ 'read', 'write', 'execute' ]);
        });

    });

    describe('Compose filter', () => {
        it('returns all permissions with coolApp and coolResource filter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource' ], operations: []});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'coolApp', resource: 'coolResource', operation: 'write' },
                { application: 'coolApp', resource: 'coolResource', operation: 'execute' }
            ]);
        });

        it('returns all permissions with coolApp and coolResource and readfilter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource' ], operations: [ 'read' ]});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' }
            ]);
        });

        it('returns all permissions with coolApp and (coolResource or anotherResource) and read filter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource', 'anotherResource' ], operations: [ 'read' ]});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'coolApp', resource: 'anotherResource', operation: 'read' }
            ]);
        });

        it('returns all permissions with (coolApp or differentApp) and (coolResource or firstResource) and read filter', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp', 'differentApp' ], resources: [ 'coolResource', 'firstResource' ], operations: [ 'read' ]});
            expect(out.filteredData).toEqual([
                { application: 'coolApp', resource: 'coolResource', operation: 'read' },
                { application: 'differentApp', resource: 'firstResource', operation: 'read' }
            ]);
        });

        it('returns all applications with coolResource', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource' ], operations: []});
            expect(out.applications).toEqual([ 'coolApp', 'duplicate' ]);
        });

        it('returns all resource that belongs to  coolApp', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource' ], operations: []});
            expect(out.resources).toEqual([ 'coolResource', 'anotherResource' ]);
        });

        it('returns all operations for coolApp and coolResource', () => {
            const out = accessWrapper(data, { applications: [ 'coolApp' ], resources: [ 'coolResource' ], operations: []});
            expect(out.operations).toEqual([ 'read', 'write', 'execute' ]);
        });

    });
});

