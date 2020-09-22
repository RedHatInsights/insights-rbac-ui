import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import useSearchParams from '../../hooks/useSearchParams';

const SpyComponent = () => <div></div>;
const HookedComponent = ({ args }) => {
  const result = useSearchParams(...args);
  return <SpyComponent result={result} />;
};

const DummyComponent = ({ args, initialEntries }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <HookedComponent args={args} />
    </MemoryRouter>
  );
};

describe('useSearchParams', () => {
  it('should retrieve foo and bar params', () => {
    const wrapper = mount(<DummyComponent args={['foo', 'bar']} initialEntries={['/route?foo=f&bar=b']} />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual({ foo: 'f', bar: 'b' });
  });

  it('should retrieve foo but not bar param', () => {
    const wrapper = mount(<DummyComponent args={['foo', 'bar']} initialEntries={['/route?foo=f']} />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual({ foo: 'f', bar: null });
  });

  it('should retrieve any params', () => {
    const wrapper = mount(<DummyComponent args={[]} initialEntries={['/route?foo=f']} />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual({});
  });
});
