import { asyncValidator } from '../../../smart-components/role/add-role/validators';

jest.mock('../../../helpers/role/role-helper', () => {
  const actions = jest.requireActual('../../../helpers/role/role-helper');

  return {
    __esModule: true,
    ...actions,
  };
});
import * as GroupActions from '../../../helpers/role/role-helper';

describe('validators', () => {
  const fetchRoles = jest.spyOn(GroupActions, 'fetchRoles');
  afterEach(() => {
    fetchRoles.mockReset();
  });

  test('should pass validation', async () => {
    fetchRoles.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    fetchRoles.mockImplementationOnce(() => Promise.resolve({ data: [] }));

    const data = await asyncValidator('foo');
    expect(data).toEqual();
  });

  test('should return undefined', async () => {
    const data = await asyncValidator();
    expect(data).toEqual();
  });

  test('should throw nameAlreadyTaken message', async () => {
    fetchRoles.mockImplementationOnce(() => Promise.resolve({ data: [1] }));
    fetchRoles.mockImplementationOnce(() => Promise.resolve({ data: [] }));

    expect.assertions(1);
    await expect(asyncValidator('foo')).rejects.toEqual('Name has already been taken.');
  });

  test('should throw error and return undefined', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');

    fetchRoles.mockImplementationOnce(() => Promise.reject('name rejected'));
    fetchRoles.mockImplementationOnce(() => Promise.reject('display name rejected'));

    await asyncValidator('foo');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });
});
