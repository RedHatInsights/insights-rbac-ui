import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type CursorLinks, useCursorPaginationState } from '../useCursorPaginationState';

const DEFAULT_OPTIONS = {
  initialPerPage: 10,
  perPageOptions: [10, 20, 50],
};

describe('useCursorPaginationState', () => {
  describe('initial state', () => {
    it('should start on page 1 with no cursor', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      expect(result.current.page).toBe(1);
      expect(result.current.perPage).toBe(10);
      expect(result.current.cursor).toBeUndefined();
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should use the provided initialPerPage', () => {
      const { result } = renderHook(() => useCursorPaginationState({ initialPerPage: 50, perPageOptions: [10, 20, 50] }));

      expect(result.current.perPage).toBe(50);
    });
  });

  describe('forward navigation', () => {
    it('should navigate to page 2 when onNextPage is called after setCursorLinks', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Simulate API response with a next link
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=abc123',
          previous: null,
        });
      });

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.page).toBe(2);
      expect(result.current.cursor).toBe('abc123');
      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should navigate through multiple pages', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Page 1 -> 2
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=page2cursor',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(2);
      expect(result.current.cursor).toBe('page2cursor');

      // Page 2 -> 3
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?cursor=page3cursor&limit=10',
          previous: 'https://api.example.com/v2/roles?cursor=page1cursor&limit=10',
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(3);
      expect(result.current.cursor).toBe('page3cursor');
    });

    it('should not navigate forward when there is no next link', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // No next link
      act(() => {
        result.current.setCursorLinks({
          next: null,
          previous: null,
        });
      });

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.cursor).toBeUndefined();
    });
  });

  describe('backward navigation', () => {
    it('should navigate back by popping cursor from stack', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Go to page 2
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=page2cursor',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(2);

      // Go back to page 1
      act(() => {
        result.current.onPreviousPage();
      });
      expect(result.current.page).toBe(1);
      expect(result.current.cursor).toBeUndefined();
    });

    it('should not navigate back from page 1', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.onPreviousPage();
      });

      expect(result.current.page).toBe(1);
    });

    it('should allow navigating forward again after going back', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Page 1 -> 2
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=page2cursor',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      // Page 2 -> 3
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=page3cursor',
          previous: 'https://api.example.com/v2/roles?limit=10&cursor=page1cursor',
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(3);

      // Go back to page 2
      act(() => {
        result.current.onPreviousPage();
      });
      expect(result.current.page).toBe(2);
      expect(result.current.cursor).toBe('page2cursor'); // Cursor from stack preserved
    });
  });

  describe('onPageChange', () => {
    it('should handle +1 page change as forward navigation', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=next',
          previous: null,
        });
      });

      act(() => {
        result.current.onPageChange(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should handle -1 page change as backward navigation', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Go to page 2 first
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=abc',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      // Go back via onPageChange
      act(() => {
        result.current.onPageChange(1);
      });

      expect(result.current.page).toBe(1);
    });

    it('should ignore non-adjacent page changes', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Jumping from page 1 to page 5 should be ignored
      act(() => {
        result.current.onPageChange(5);
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('perPage change', () => {
    it('should reset to page 1 and clear cursor stack when perPage changes', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Navigate to page 2
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=abc',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(2);

      // Change perPage
      act(() => {
        result.current.onPerPageChange(50);
      });

      expect(result.current.page).toBe(1);
      expect(result.current.perPage).toBe(50);
      expect(result.current.cursor).toBeUndefined();
    });
  });

  describe('resetPage', () => {
    it('should reset to page 1 and clear cursor stack', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      // Navigate to page 3
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=c1',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=c2',
          previous: 'https://api.example.com/v2/roles?limit=10&cursor=c0',
        });
      });
      act(() => {
        result.current.onNextPage();
      });
      expect(result.current.page).toBe(3);

      // Reset
      act(() => {
        result.current.resetPage();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.cursor).toBeUndefined();
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  describe('URL cursor extraction', () => {
    it('should extract cursor from standard URL format', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=eyJpZCI6IjEyMyJ9',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.cursor).toBe('eyJpZCI6IjEyMyJ9');
    });

    it('should extract cursor from URL with cursor as first param', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?cursor=first-param&limit=10',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.cursor).toBe('first-param');
    });

    it('should extract cursor from relative URL paths', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: '/api/rbac/v2/roles/?limit=10&cursor=relative-cursor',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.cursor).toBe('relative-cursor');
    });

    it('should handle URL-encoded cursor values', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10&cursor=abc%3D%3D',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.cursor).toBe('abc==');
    });
  });

  describe('hasNextPage and hasPreviousPage', () => {
    it('should report hasNextPage=true when next link exists', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?cursor=next',
          previous: null,
        });
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it('should report hasPreviousPage=true when on page > 1', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?cursor=next',
          previous: null,
        });
      });
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should report hasNextPage=false when next link is null (last page)', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: null,
          previous: 'https://api.example.com/v2/roles?cursor=prev',
        });
      });

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle links with no cursor param gracefully', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'https://api.example.com/v2/roles?limit=10',
          previous: null,
        });
      });

      // onNextPage should be a no-op since no cursor could be extracted
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.page).toBe(1);
    });

    it('should handle malformed URLs gracefully', () => {
      const { result } = renderHook(() => useCursorPaginationState(DEFAULT_OPTIONS));

      act(() => {
        result.current.setCursorLinks({
          next: 'not a url at all',
          previous: null,
        } as CursorLinks);
      });

      // Should not crash, just fail to extract cursor
      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.page).toBe(1);
    });
  });
});
