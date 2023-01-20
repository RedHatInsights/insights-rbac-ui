import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { DataList, DataListCell, DataListItem, DataListItemRow, DataListItemCells, Form, FormGroup } from '@patternfly/react-core';
import ContentLoader from 'react-content-loader';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';

export const ListLoader = ({ items, isCompact, ...props }) => (
  <Fragment>
    <DataList aria-label="datalist-placeholder" isCompact={isCompact}>
      {[...Array(items)].map((_item, index) => (
        <DataListItem key={index} aria-labelledby="datalist-item-placeholder">
          <DataListItemRow aria-label="datalist-item-placeholder-row">
            <DataListItemCells
              dataListCells={[
                <DataListCell key="1">
                  <Skeleton size={SkeletonSize.lg} {...props} />
                </DataListCell>,
              ]}
            />
          </DataListItemRow>
        </DataListItem>
      ))}
    </DataList>
  </Fragment>
);

ListLoader.propTypes = {
  items: PropTypes.number,
  isCompact: PropTypes.bool,
};

ListLoader.defaultProps = {
  items: 5,
};

export const AppPlaceholder = (props) => (
  <div>
    <ContentLoader height={16} width={300} speed={2} {...props}>
      <rect x="0" y="0" rx="0" ry="0" width="420" height="10" />
    </ContentLoader>
    <ListLoader />
  </div>
);

export const ToolbarTitlePlaceholder = (props) => {
  return (
    <div style={{ width: '200px', height: '21px' }}>
      <ContentLoader height={21} width={200} speed={2} {...props}>
        <rect x="0" y="0" rx="0" ry="0" width="200" height="21" />
      </ContentLoader>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
export const BreadcrumbPlaceholder = ({ showDivider, ...props }) => {
  return (
    <div style={{ width: '200px', height: '18px' }}>
      <ContentLoader height={18} width={200} speed={2} {...props}>
        <rect x="0" y="0" rx="0" ry="0" width="200" height="18" />
      </ContentLoader>
    </div>
  );
};

BreadcrumbPlaceholder.propTypes = {
  showDivider: PropTypes.any,
};

export const FormItemLoader = () => (
  <ContentLoader height={32} width={160} speed={2}>
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
