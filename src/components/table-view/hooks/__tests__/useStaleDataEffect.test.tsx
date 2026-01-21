import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStaleDataEffect } from '../useStaleDataEffect';

describe('useStaleDataEffect - edge cases not covered by useTableState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('no callback provided', () => {
    it('should not throw when onStaleData is undefined', () => {
      expect(() => {
        renderHook(() => useStaleDataEffect({ page: 1 }, undefined));
      }).not.toThrow();
    });

    it('should handle params changes gracefully when no callback', () => {
      const { rerender } = renderHook(({ params }) => useStaleDataEffect(params, undefined), {
        initialProps: { params: { page: 1 } },
      });

      expect(() => {
        rerender({ params: { page: 2 } });
        vi.advanceTimersByTime(300);
      }).not.toThrow();
    });
  });

  describe('unmount cancellation', () => {
    it('should cancel pending debounced call on unmount', () => {
      const onStaleData = vi.fn();

      const { rerender, unmount } = renderHook(({ params }) => useStaleDataEffect(params, onStaleData, 300), {
        initialProps: { params: { page: 1 } },
      });

      // Initial call
      expect(onStaleData).toHaveBeenCalledTimes(1);
      onStaleData.mockClear();

      // Trigger a change that will be debounced
      rerender({ params: { page: 2 } });

      // Unmount before debounce fires
      unmount();

      // Advance timer past debounce
      vi.advanceTimersByTime(500);

      // Callback should NOT have been called (was cancelled)
      expect(onStaleData).toHaveBeenCalledTimes(0);
    });
  });

  describe('callback ref stability', () => {
    it('should use latest callback without causing extra calls', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(({ params, callback }) => useStaleDataEffect(params, callback, 300), {
        initialProps: { params: { page: 1 }, callback: callback1 },
      });

      // Initial call with callback1
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(0);

      callback1.mockClear();

      // Change callback (simulating inline function recreation)
      rerender({ params: { page: 1 }, callback: callback2 });

      // No extra calls should happen just from callback change
      expect(callback1).toHaveBeenCalledTimes(0);
      expect(callback2).toHaveBeenCalledTimes(0);

      // Now change params
      rerender({ params: { page: 2 }, callback: callback2 });

      // Advance debounce timer
      vi.advanceTimersByTime(300);

      // Should call the NEW callback (callback2), not the old one
      expect(callback1).toHaveBeenCalledTimes(0);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith({ page: 2 });
    });

    it('should not cause infinite loop with inline callback', () => {
      let callCount = 0;

      const { rerender } = renderHook(
        ({ params }) =>
          useStaleDataEffect(params, () => {
            callCount++;
          }),
        { initialProps: { params: { page: 1 } } },
      );

      // Simulate multiple rerenders with new inline callbacks each time
      // (this is what happens when users pass inline functions)
      for (let i = 0; i < 50; i++) {
        rerender({ params: { page: 1 } }); // Same params, new inline callback each time
      }

      vi.advanceTimersByTime(1000);

      // The key assertion: should NOT have called 50+ times (one per rerender)
      // It's OK if it called a few times (initial mount, etc.), but not hundreds
      // This verifies the ref pattern prevents infinite loops
      expect(callCount).toBeLessThan(10);
    });
  });
});
