import React from 'react';
import { render } from '@testing-library/react';
import { ActiveUsers } from './ActiveUsers';

describe('<ActiveUsers />', () => {
  it('should render correctly', () => {
    const { container } = render(<ActiveUsers />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with link description', () => {
    const { container } = render(<ActiveUsers linkDescription="some description" />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with link title', () => {
    const { container } = render(<ActiveUsers linkTitle="some title" />);
    expect(container).toMatchSnapshot();
  });
});
