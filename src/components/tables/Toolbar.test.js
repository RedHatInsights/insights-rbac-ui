import React from 'react';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar, activeFiltersConfigBuilder, bulkSelectBuilder, filterConfigBuilder, paginationBuilder } from './Toolbar';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';

// Mock intl object for testing
const mockIntl = {
  formatMessage: (message, values = {}) => {
    // Handle message objects with defaultMessage property
    if (typeof message === 'object' && message.defaultMessage) {
      let text = message.defaultMessage;
      // Replace placeholders with values only if values are provided
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          text = text.replace(new RegExp(`{${key}}`, 'g'), value);
        }
      });
      return text;
    }
    // Fallback for string messages
    return message;
  },
};

const testPagination = {
  itemCount: 0,
  page: 1,
  perPage: 20,
  perPageOptions: PER_PAGE_OPTIONS,
};

const testBulkSelect = {
  checked: false,
  count: 0,
  items: [
    {
      title: 'Select none (0)',
      onClick: expect.any(Function),
    },
  ],
};

const testFilter = {
  items: [
    {
      filterValues: {
        id: 'filter-by-string',
        isDisabled: undefined,
        placeholder: 'Filter by ',
        value: '',
      },
      label: '',
      type: 'text',
    },
  ],
};

const testActiveFilter = {
  filters: [{ name: '' }],
};

describe('<Toolbar>', () => {
  it('should render correctly - NO DATA', () => {
    const { container } = render(<Toolbar />);
    expect(container).toMatchSnapshot();
  });

  describe('isSelectable', () => {
    [true, false].map((isLoading) => {
      it(`is loading - ${isLoading}`, () => {
        const { container } = render(<Toolbar isLoading={isLoading} isSelectable />);
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe('checkedRows', () => {
    [true, false].map((isLoading) => {
      it(`is loading - ${isLoading} NO DATA`, () => {
        const { container } = render(<Toolbar isLoading={isLoading} isSelectable checkedRows={[{ uuid: 'some' }]} />);
        expect(container).toMatchSnapshot();
      });

      it(`is loading - ${isLoading}`, () => {
        const { container } = render(<Toolbar isLoading={isLoading} isSelectable checkedRows={[{ uuid: 'some' }]} data={[{ uuid: 'some' }]} />);
        expect(container).toMatchSnapshot();
      });
    });
  });

  it('should render with filterValue', () => {
    const { container } = render(<Toolbar filterValue="some" />);
    expect(container).toMatchSnapshot();
  });

  it('should render buttons', () => {
    const { container } = render(
      <Toolbar
        toolbarButtons={() => [
          <button key={1}>Something</button>,
          {
            title: 'fff',
          },
        ]}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render pagination', () => {
    const { container } = render(
      <Toolbar
        pagination={{
          count: 10,
          limit: 10,
          offset: 0,
        }}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  [true, false].map((isLoading) => {
    it(`should render with full data is loading - ${isLoading}`, () => {
      const { container } = render(
        <Toolbar
          isLoading={false}
          isSelectable
          checkedRows={[{ uuid: 'some' }]}
          data={[{ uuid: 'some' }]}
          filterValue="some"
          pagination={{
            count: 10,
            limit: 10,
            offset: 0,
          }}
          toolbarButtons={() => [
            <button key={1}>Something</button>,
            {
              title: 'fff',
            },
          ]}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('filters', () => {
    it('should render with placeholder', () => {
      const { container } = render(<Toolbar filterValue="some" filterPlaceholder="test" />);
      expect(container).toMatchSnapshot();
    });

    it('should render with text filters', () => {
      const { container } = render(<Toolbar filterValue="some" filters={[{ key: 'name', value: '' }]} />);
      expect(container).toMatchSnapshot();
    });

    it('call filter update with correct value', async () => {
      const setFilterValue = jest.fn();
      let container;
      act(() => {
        const { container: ci } = render(<Toolbar filterValue="some" filters={[{ key: 'name', value: '' }]} setFilterValue={setFilterValue} />);
        container = ci;
      });
      const target = container.querySelector('input#filter-by-name');
      await act(async () => {
        await userEvent.type(target, 'something');
      });
      expect(setFilterValue).toHaveBeenCalled();
    });
  });
});

describe('paginationBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = paginationBuilder();
    expect(config).toMatchObject(testPagination);
  });
});

describe('bulkSelectBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = bulkSelectBuilder(mockIntl);
    expect(config).toMatchObject(testBulkSelect);
  });
});

describe('filterConfigBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = filterConfigBuilder(mockIntl);
    expect(config).toMatchObject(testFilter);
  });
});

describe('activeFiltersConfigBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = activeFiltersConfigBuilder();
    expect(config).toMatchObject(testActiveFilter);
  });
});
