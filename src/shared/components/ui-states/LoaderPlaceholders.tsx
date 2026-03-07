import React from 'react';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Skeleton as PFSkeleton } from '@patternfly/react-core';
import { Skeleton } from '@redhat-cloud-services/frontend-components/Skeleton';

export const AppPlaceholder: React.FC = () => (
  <div>
    <div style={{ height: 16, width: 300 }}>
      <Skeleton />
    </div>
    <SkeletonTable />
  </div>
);

export const ToolbarTitlePlaceholder: React.FC = () => {
  return (
    <div style={{ width: '200px', height: '21px' }}>
      <Skeleton />
    </div>
  );
};

export const BreadcrumbPlaceholder: React.FC = () => {
  return (
    <div style={{ width: '200px', height: '18px' }}>
      <PFSkeleton fontSize="sm" />
    </div>
  );
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
