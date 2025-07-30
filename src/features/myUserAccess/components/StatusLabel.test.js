import React from 'react';
import { render } from '@testing-library/react';
import StatusLabel from './StatusLabel';

describe('<StatusLabel />', () => {
  it('should render correctly', () => {
    const { container } = render(<StatusLabel />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly as admin', () => {
    const { container } = render(<StatusLabel isOrgAdmin />);
    expect(container).toMatchSnapshot();
  });
});
