import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useSearchParams from '../../hooks/useSearchParams';

describe('useSearchParams', () => {
  it('should retrieve foo and bar params', () => {
    const { result } = renderHook(() => useSearchParams('foo', 'bar'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/route?foo=f&bar=b']}>{children}</MemoryRouter>,
    });
    expect(result.current).toEqual({ foo: 'f', bar: 'b' });
  });

  it('should retrieve foo but not bar param', () => {
    const { result } = renderHook(() => useSearchParams('foo', 'bar'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/route?foo=f']}>{children}</MemoryRouter>,
    });
    expect(result.current).toEqual({ foo: 'f', bar: null });
  });

  it('should not retrieve any params', () => {
    const { result } = renderHook(() => useSearchParams('foo', 'bar'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/route']}>{children}</MemoryRouter>,
    });
    expect(result.current).toEqual({ foo: null, bar: null });
  });
});
