import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  Form,
  FormGroup,
  Skeleton as PFSkeleton,
} from '@patternfly/react-core';
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

export const AppPlaceholder = () => (
  <div>
    <div style={{ height: 16, width: 300 }}>
      <Skeleton />
    </div>
    <ListLoader />
  </div>
);

export const ToolbarTitlePlaceholder = () => {
  return (
    <div style={{ width: '200px', height: '21px' }}>
      <Skeleton />
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
export const BreadcrumbPlaceholder = ({ showDivider, ...props }) => {
  return (
    <div style={{ width: '200px', height: '18px' }}>
      <PFSkeleton fontSize="sm" />
    </div>
  );
};

BreadcrumbPlaceholder.propTypes = {
  showDivider: PropTypes.any,
};

export const FormItemLoader = () => (
  <div style={{ height: 32, width: 160 }}>
    <Skeleton />
  </div>
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
