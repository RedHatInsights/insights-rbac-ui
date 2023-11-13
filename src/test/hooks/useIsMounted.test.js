import React, { Fragment, useEffect } from 'react';
import useIsMounted from '../../hooks/useIsMounted';
import { render } from '@testing-library/react';

describe('useIsMounted', () => {
  const DummyComponent = ({ mountSpy }) => {
    const isMounted = useIsMounted();
    useEffect(() => {
      mountSpy(isMounted.current);
      setTimeout(() => {
        mountSpy(isMounted.current);
      }, 200);
    }, []);
    return Fragment;
  };

  it('should call mountSpy with false after component is removed from DOM', () => {
    expect.assertions(3);
    jest.useFakeTimers();

    const spy = jest.fn();
    const { unmount } = render(<DummyComponent mountSpy={spy} />);
    expect(spy).toHaveBeenLastCalledWith(true);
    unmount();

    jest.advanceTimersByTime(200);
    expect(spy).toHaveBeenLastCalledWith(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
