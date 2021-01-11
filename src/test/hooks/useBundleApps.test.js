import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import useBundleApps from '../../hooks/useBundleApps';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';

const SpyComponent = () => <div></div>;
const HookedComponent = ({ bundle }) => {
  const result = useBundleApps(bundle);
  return <SpyComponent result={result} />;
};

const DummyComponent = ({ bundle, initialEntries }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <HookedComponent bundle={bundle} />
    </MemoryRouter>
  );
};

describe('useBundleApps', () => {
  it('should retrieve an array of insights apps', () => {
    const wrapper = mount(<DummyComponent bundle="insights" />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual(bundleData[0].appsIds);
  });

  it('should retrieve an empty array apps from incorrect bundle', () => {
    const wrapper = mount(<DummyComponent bundle="nonsense" />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual([]);
  });

  it('should redirect to first app if no bundle id is passed', async () => {
    const wrapper = mount(<DummyComponent initialEntries={['/foo']} bundle="" />);
    expect(wrapper.find(SpyComponent).prop('result')).toEqual([]);
    /**
     * Update to trigger router change
     */
    wrapper.update();
    expect(wrapper.find(MemoryRouter).instance().history.location.search).toEqual('?bundle=insights');
  });
});
