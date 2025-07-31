import { asyncValidator } from '../../../features/roles/add-role/validators';
import * as RoleHelper from '../../../redux/roles/helper';

jest.mock('../../../redux/roles/helper', () => {
  const actions = jest.requireActual('../../../redux/roles/helper');

  return {
    __esModule: true,
    ...actions,
  };
});

describe('validators', () => {
  const fetchRoles = jest.spyOn(RoleHelper, 'fetchRoles');
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
