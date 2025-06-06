import React from 'react';
import PropTypes from 'prop-types';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { Form, FormGroup, Skeleton as PFSkeleton } from '@patternfly/react-core';
import { Skeleton } from '@redhat-cloud-services/frontend-components/Skeleton';

export const AppPlaceholder = () => (
  <div>
    <div style={{ height: 16, width: 300 }}>
      <Skeleton />
    </div>
    <SkeletonTable numberOfColumns={1} />
  </div>
);

export const ToolbarTitlePlaceholder = () => {
  return (
    <div style={{ width: '200px', height: '21px' }}>
      <Skeleton />
    </div>
  );
};

export const BreadcrumbPlaceholder = () => {
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
