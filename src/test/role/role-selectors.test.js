const { roleSelector, roleNameSelector } = require('../../features/roles/roleSelectors');

describe('role selectors', () => {
  describe('role selector', () => {
    it('should pick role from selected role', () => {
      const state = {
        roleReducer: {
          selectedRole: { uuid: 'foo' },
        },
      };

      expect(roleSelector(state, 'foo')).toEqual({ uuid: 'foo' });
    });

    it('should pick role from roles array', () => {
      const state = {
        roleReducer: {
          selectedRole: { uuid: 'bar' },
          roles: { data: [{ uuid: 'foo' }] },
        },
      };

      expect(roleSelector(state, 'foo')).toEqual({ uuid: 'foo' });
    });

    it('should not return any role', () => {
      const state = {
        roleReducer: {
          selectedRole: { uuid: 'bar' },
          roles: { data: [{ uuid: 'baz' }] },
        },
      };

      expect(roleSelector(state, 'foo')).toEqual(undefined);
    });
  });

  describe('Role name selector', () => {
    it('should pick role name from state', () => {
      const state = {
        roleReducer: {
          selectedRole: { uuid: 'foo', name: 'wrong-attribute', display_name: 'role-name' },
        },
      };

      expect(roleNameSelector(state, 'foo')).toEqual('role-name');
    });
  });
});
