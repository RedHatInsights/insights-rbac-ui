import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOptionalSearchParams } from '../useOptionalSearchParams';

describe('useOptionalSearchParams - behavior outside Router context', () => {
  // Note: useTableState tests already cover in-router behavior via URL sync tests
  // These tests cover the fallback behavior when no Router is present

  describe('outside Router context', () => {
    it('should return isRouterAvailable as false', () => {
      // Render WITHOUT a Router wrapper
      const { result } = renderHook(() => useOptionalSearchParams());

      expect(result.current.isRouterAvailable).toBe(false);
    });

    it('should provide empty searchParams when no Router', () => {
      const { result } = renderHook(() => useOptionalSearchParams());

      // Should have empty params (no URL to read from in test environment)
      expect(result.current.searchParams.toString()).toBe('');
    });

    it('should allow setting params locally (not persisted to URL)', () => {
      const { result } = renderHook(() => useOptionalSearchParams());

      // Set some params
      act(() => {
        result.current.setSearchParams((prev) => {
          prev.set('test', 'value');
          return prev;
        });
      });

      // Params should be updated in local state
      expect(result.current.searchParams.get('test')).toBe('value');
    });

    it('should work correctly without crashing', () => {
      // This is the main value - it doesn't throw when used outside Router
      expect(() => {
        const { result } = renderHook(() => useOptionalSearchParams());
        act(() => {
          result.current.setSearchParams((prev) => {
            prev.set('page', '2');
            return prev;
          });
        });
      }).not.toThrow();
    });
  });

  describe('inside Router context (reference)', () => {
    const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/?existing=param']}>{children}</MemoryRouter>
    );

    it('should return isRouterAvailable as true', () => {
      const { result } = renderHook(() => useOptionalSearchParams(), {
        wrapper: RouterWrapper,
      });

      expect(result.current.isRouterAvailable).toBe(true);
    });

    it('should read existing URL params', () => {
      const { result } = renderHook(() => useOptionalSearchParams(), {
        wrapper: RouterWrapper,
      });

      expect(result.current.searchParams.get('existing')).toBe('param');
    });
  });
});
