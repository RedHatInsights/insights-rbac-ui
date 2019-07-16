import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemRow,
  DataListItemCells
} from '@patternfly/react-core';
import { Section } from '@redhat-cloud-services/frontend-components';
import ContentLoader from 'react-content-loader';

export const ListLoader = ({ items, ...props }) => (
  <Fragment>
    <Section className="data-table-pane">
      <DataList aria-labelledby="datalist-placeholder" style={ { margin: 32 } }>
        { [ ...Array(items) ].map((_item, index) => (
          <DataListItem key={ index } aria-labelledby="datalist-item-placeholder">
            <DataListItemRow>
              <DataListItemCells dataListCells={ [
                <DataListCell key="1">
                  <ContentLoader
                    height={ 12 }
                    width={ 300 }
                    speed={ 2 }
                    primaryColor="#FFFFFF"
                    secondaryColor="#ecebeb"
                    { ...props }>
                    <rect x="0" y="0" rx="0" ry="0" width="300" height="12" />
                  </ContentLoader>
                </DataListCell>
              ] }
              />
            </DataListItemRow>
          </DataListItem>
        )) }
      </DataList>
    </Section>
  </Fragment>
);

ListLoader.propTypes = {
  items: PropTypes.number
};

ListLoader.defaultProps = {
  items: 5
};

export const AppPlaceholder = props => (
  <div>
    <ContentLoader
      height={ 16 }
      width={ 300 }
      speed={ 2 }
      primaryColor="#FFFFFF"
      secondaryColor="#FFFFFF"
      { ...props }>
      <rect x="0" y="0" rx="0" ry="0" width="420" height="10" />
    </ContentLoader>
    <ListLoader />
  </div>
);
