import React from 'react';
import ContentLoader from 'react-content-loader';
import PropTypes from 'prop-types';
import { Card, CardBody, Grid, GridItem } from '@patternfly/react-core';

export const CardLoader = ({ items, ...props }) => (
  <Grid  gutter="md">
    <GridItem sm={ 12 } style={ { padding: 24 } }>
      <Grid  gutter="md">
        { [ ...Array(items) ].map((_item, index) => <GridItem sm={ 12 } md={ 6 } lg={ 3 } key={ index }><Card>
          <CardBody>
            <ContentLoader
              height={ 160 }
              width={ 300 }
              speed={ 2 }
              primaryColor="#f3f3f3"
              secondaryColor="#ecebeb"
              { ...props }
            >
              <rect x="2" y="99" rx="3" ry="3" width="300" height="6.4" />
            </ContentLoader>
          </CardBody>
        </Card></GridItem>) }
      </Grid>
    </GridItem>
  </Grid>
);

CardLoader.propTypes = {
  items: PropTypes.number
};

CardLoader.defaultProps = {
  items: 1
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
    <CardLoader />
  </div>
);
