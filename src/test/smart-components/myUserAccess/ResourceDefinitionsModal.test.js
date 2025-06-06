import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import ResourceDefinitionsModal from '../../../smart-components/myUserAccess/ResourceDefinitionsModal';

describe('<ResourceDefinitionsModal />', () => {
  const initialProps = {
    isOpen: true,
    handleClose: jest.fn(),
    permission: 'foo:bar:baz',
    resourceDefinitions: [
      {
        attributeFilter: {
          value: 'first-rd',
        },
      },
      {
        attributeFilter: {
          value: 'second-rd',
        },
      },
    ],
  };

  it('should render a modal with table and two rows', async () => {
    render(<ResourceDefinitionsModal {...initialProps} />);
    expect(screen.getByText('Resource definitions')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Resource definitions')).toHaveLength(1);
    expect(screen.getAllByRole('row')).toHaveLength(2 + 1); // 2 rows + header
  });

  it('should filter rows by resource definition', () => {
    render(<ResourceDefinitionsModal {...initialProps} />);
    fireEvent.change(screen.getByLabelText('text input'), { target: { value: 'first' } });
    expect(screen.getAllByRole('row')).toHaveLength(1 + 1); // result row + header
    expect(screen.getByText('first-rd')).toBeInTheDocument();
  });

  it('should change pagination configuration', () => {
    // generate 100 resource definitions
    render(
      <ResourceDefinitionsModal
        {...initialProps}
        resourceDefinitions={[...Array(100)].map((_, i) => ({
          attributeFilter: { value: `definition-${i}` },
        }))}
      />,
    );
    const preparePaginationTextMatcher = (pageSize) => (_, element) => {
      if (element.tagName === 'BUTTON' && element.textContent) {
        return element.textContent.trim() === `1 - ${pageSize} of 100`;
      }

      return false;
    };
    expect(screen.getAllByText(preparePaginationTextMatcher(20))).toHaveLength(2);

    fireEvent.click(screen.getAllByText(preparePaginationTextMatcher(20))[0]);

    act(() => {
      fireEvent.click(screen.getByText('100 per page'));
    });
    expect(screen.getAllByText(preparePaginationTextMatcher(100))).toHaveLength(2);
  });
});
