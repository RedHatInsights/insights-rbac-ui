import React from 'react';
import { render } from '@testing-library/react';
import NoMatch from '../../../presentational-components/shared/404-route';

describe('<NoMatch />', () => {
  it('should render correctly', () => {
    const { container } = render(<NoMatch />);
    expect(container).toMatchSnapshot();
  });
});
