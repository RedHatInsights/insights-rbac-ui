import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  Form,
  FormGroup
} from '@patternfly/react-core';
import { Section } from '@redhat-cloud-services/frontend-components';
import ContentLoader from 'react-content-loader';

export const ListLoader = ({ items, ...props }) => (
  <Fragment>
    <Section type="content">
      <DataList aria-label="datalist-placeholder">
        { [ ...Array(items) ].map((_item, index) => (
          <DataListItem key={ index } aria-labelledby="datalist-item-placeholder">
            <DataListItemRow aria-label="datalist-item-placeholder-row">
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

export const ToolbarTitlePlaceholder = props => (
  <ContentLoader
    height={ 21 }
    width={ 200 }
    speed={ 2 }
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
    { ...props }
  >
    <rect x="0" y="0" rx="0" ry="0" width="200" height="21" />
  </ContentLoader>
);

export const FormItemLoader = () => (
  <ContentLoader
    height={ 32 }
    width={ 160 }
    speed={ 2 }
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
  >
    <rect x="0" y="0" rx="0" ry="0" width="160" height="32" />
  </ContentLoader>
);

export const PolicyRolesLoader = () => (
  <Form>
    <FormGroup fieldId="1">
      <FormItemLoader />
    </FormGroup>
    <FormGroup fieldId="2">
      <FormItemLoader />
    </FormGroup>
  </Form>
);
