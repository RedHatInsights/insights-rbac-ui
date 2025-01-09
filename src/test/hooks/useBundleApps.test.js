import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import useBundleApps from '../../hooks/useBundleApps';
import { renderHook } from '@testing-library/react';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('useBundleApps', () => {
  it('should retrieve an array of rhel apps', () => {
    const { result } = renderHook(() => useBundleApps('rhel'), {
      wrapper: MemoryRouter,
    });
    expect(result.current).toEqual(bundleData[1].appsIds);
  });

  it('should retrieve an empty array apps from incorrect bundle', () => {
    const { result } = renderHook(() => useBundleApps('nonsense'), {
      wrapper: MemoryRouter,
    });
    expect(result.current).toEqual([]);
  });

  it('should redirect to rhel first app if no bundle id is passed', async () => {
    const { result } = renderHook(() => useBundleApps(''), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/foo']}>{children}</MemoryRouter>,
    });
    expect(result.current).toEqual([]);
    /**
     * Update to trigger router change
     */
    expect(mockedNavigate).toHaveBeenCalledWith({ search: 'bundle=rhel', to: '/foo' }, { replace: true });
  });
});
