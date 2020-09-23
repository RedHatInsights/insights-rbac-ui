const { Fragment, useEffect } = require('react');
const { default: useIsMounted } = require('../../hooks/useIsMounted');

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
    const wrapper = mount(<DummyComponent mountSpy={spy} />);
    expect(spy).toHaveBeenLastCalledWith(true);
    wrapper.unmount();

    jest.advanceTimersByTime(200);
    expect(spy).toHaveBeenLastCalledWith(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
