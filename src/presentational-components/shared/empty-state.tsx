import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateVariant, Title } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';

interface EmptyWithActionProps {
  title: string;
  icon?: React.ComponentClass<SVGIconProps, any>;
  description: any;
  actions: any;
}

const EmptyWithAction = ({ title, icon, description, actions, ...props }: EmptyWithActionProps) => (
  <EmptyState variant={EmptyStateVariant.small} {...props}>
    <EmptyStateIcon icon={icon || SearchIcon} />
    <Title headingLevel="h4" size="lg">
      {title}
    </Title>
    <EmptyStateBody className="pf-u-mb-md">
      {description.map((text: React.ReactNode, key: number) => (
        <React.Fragment key={key}>
          {text} <br />
        </React.Fragment>
      ))}
    </EmptyStateBody>
    {actions}
  </EmptyState>
);

export default EmptyWithAction;
