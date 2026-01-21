import React, { Fragment, useEffect } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useIsMounted from '../../hooks/useIsMounted';

describe('useIsMounted', () => {
  const DummyComponent = ({ mountSpy }: { mountSpy: (value: boolean) => void }) => {
    const isMounted = useIsMounted();
    useEffect(() => {
      mountSpy(isMounted.current);
      setTimeout(() => {
        mountSpy(isMounted.current);
      }, 200);
    }, []);
    return <Fragment />;
  };

  it('should call mountSpy with false after component is removed from DOM', () => {
    expect.assertions(3);
    vi.useFakeTimers();

    const spy = vi.fn();
    const { unmount } = render(<DummyComponent mountSpy={spy} />);
    expect(spy).toHaveBeenLastCalledWith(true);
    unmount();

    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenLastCalledWith(false);
    expect(spy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
