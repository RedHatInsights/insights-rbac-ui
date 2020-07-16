import React from 'react';
import { shallow, mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import Toolbar, {
  paginationBuilder,
  bulkSelectBuilder,
  filterConfigBuilder,
  activeFiltersConfigBuilder
} from '../../../presentational-components/shared/toolbar';

const testPagination = {
  itemCount: undefined,
  page: 1,
  perPage: undefined,
  perPageOptions: [
    { title: '5', value: 5 }, { title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }
  ]};

const testBulkSelect = {
  checked: false,
  count: undefined,
  items: [
    { title: 'Select none (0)' }, {}
  ]
};

const testFilter = {
  items: [
    {
      filterValues: {
        id: 'filter-by-string',
        isDisabled: undefined,
        key: 'filter-by-string',
        placeholder: 'Filter by ',
        value: ''
      },
      label: '',
      type: 'text'
    }
  ]
};

const testActiveFilter = {
  filters: [{ name: '' }]
};

describe('<Toolbar>', () => {
  it('should render correctly - NO DATA', () => {
    const wrapper = shallow(<Toolbar />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  describe('isSelectable', () => {
    [ true, false ].map((isLoading) => {
      it(`is loading - ${isLoading}`, () => {
        const wrapper = shallow(<Toolbar isLoading={ isLoading } isSelectable/>);
        expect(toJson(wrapper)).toMatchSnapshot();
      });
    });
  });

  describe('checkedRows', () => {
    [ true, false ].map((isLoading) => {
      it(`is loading - ${isLoading} NO DATA`, () => {
        const wrapper = shallow(<Toolbar isLoading={ isLoading } isSelectable checkedRows={ [{ uuid: 'some' }] }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
      });

      it(`is loading - ${isLoading}`, () => {
        const wrapper = shallow(<Toolbar
          isLoading={ isLoading }
          isSelectable
          checkedRows={ [{ uuid: 'some' }] }
          data={ [{ uuid: 'some' }] }
        />);
        expect(toJson(wrapper)).toMatchSnapshot();
      });
    });
  });

  it('should render with filterValue', () => {
    const wrapper = shallow(<Toolbar filterValue='some' />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render buttons', () => {
    const wrapper = shallow(<Toolbar toolbarButtons={ () => ([
      <button key={ 1 }>Something</button>,
      {
        title: 'fff'
      }
    ]) } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render pagination', () => {
    const wrapper = shallow(<Toolbar pagination={ {
      count: 10,
      limit: 10,
      offset: 0
    } } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  [ true, false ].map(isLoading => {
    it(`should render with full data is loading - ${isLoading}`, () => {
      const wrapper = shallow(<Toolbar
        isLoading={ false }
        isSelectable
        checkedRows={ [{ uuid: 'some' }] }
        data={ [{ uuid: 'some' }] }
        filterValue='some'
        pagination={ {
          count: 10,
          limit: 10,
          offset: 0
        } }
        toolbarButtons={ () => ([
          <button key={ 1 }>Something</button>,
          {
            title: 'fff'
          }
        ]) }
      />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });
  });

  describe('filters', () => {
    it('should render with placeholder', () => {
      const wrapper = shallow(<Toolbar filterValue='some' filterPlaceholder='test' />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render with text filters', () => {
      const wrapper = shallow(<Toolbar filterValue='some' filters={ [{ key: 'name', value: '' }] } />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('call filter update with correct value', () => {
      const setFilterValue = jest.fn();
      const wrapper = mount(<Toolbar
        filterValue='some'
        filters={ [{ key: 'name', value: '' }] }
        setFilterValue={ setFilterValue }
      />);
      const target = wrapper.find('input#filter-by-name');
      target.getDOMNode().value = 'something';
      target.simulate('change');
      wrapper.update();
      expect(setFilterValue).toHaveBeenCalled();
      expect(setFilterValue.mock.calls[0][0]).toMatchObject({ name: 'something' });
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

