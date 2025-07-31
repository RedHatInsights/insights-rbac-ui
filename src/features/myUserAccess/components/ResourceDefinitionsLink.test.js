import React from 'react';
import { render, screen } from '@testing-library/react';
import ResourceDefinitionsLink from './ResourceDefinitionsLink';

describe('<ResourceDefinitionsLink />', () => {
  it('should render enabled and show RD length', () => {
    render(<ResourceDefinitionsLink onClick={jest.fn()} access={{ resourceDefinitions: [1] }} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render disabled and show RD length NA', () => {
    render(<ResourceDefinitionsLink onClick={jest.fn()} access={{ resourceDefinitions: [] }} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
