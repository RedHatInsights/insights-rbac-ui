import React from 'react';
import { act, render } from '@testing-library/react';
import Toolbar, {
  paginationBuilder,
  bulkSelectBuilder,
  filterConfigBuilder,
  activeFiltersConfigBuilder,
} from '../../../presentational-components/shared/toolbar';
import userEvent from '@testing-library/user-event';

const testPagination = {
  itemCount: undefined,
  page: 1,
  perPage: undefined,
  perPageOptions: [
    { title: '5', value: 5 },
    { title: '10', value: 10 },
    { title: '20', value: 20 },
    { title: '50', value: 50 },
    { title: '100', value: 100 },
  ],
};

const testBulkSelect = {
  checked: false,
  count: 0,
  items: [{ title: 'Select none (0)' }, {}],
};

const testFilter = {
  items: [
    {
      filterValues: {
        id: 'filter-by-string',
        isDisabled: undefined,
        key: 'filter-by-string',
        placeholder: 'Filter by {key}',
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
      />
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
      />
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
        />
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
    const config = bulkSelectBuilder();
    expect(config).toMatchObject(testBulkSelect);
  });
});

describe('filterConfigBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = filterConfigBuilder();
    expect(config).toMatchObject(testFilter);
  });
});

describe('activeFiltersConfigBuilder', () => {
  it('should return correct config - NO DATA', () => {
    const config = activeFiltersConfigBuilder();
    expect(config).toMatchObject(testActiveFilter);
  });
});
