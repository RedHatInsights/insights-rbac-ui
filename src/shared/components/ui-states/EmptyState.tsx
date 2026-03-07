import React from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import { EmptyStateVariant } from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface EmptyWithActionProps {
  title: string;
  icon?: React.ComponentClass<Omit<React.HTMLProps<SVGElement>, 'ref'>, Record<string, unknown>>;
  description: React.ReactNode[];
  actions: React.ReactNode;
}

const EmptyWithAction = ({ title, icon, description, actions, ...props }: EmptyWithActionProps) => (
  <EmptyState headingLevel="h4" icon={icon || SearchIcon} titleText={<>{title}</>} variant={EmptyStateVariant.sm} {...props}>
    <EmptyStateBody className="pf-v6-u-mb-md">
      {description.map((text: React.ReactNode, key: number) => (
        <React.Fragment key={key}>
          {text} <br />
        </React.Fragment>
      ))}
    </EmptyStateBody>
    <EmptyStateFooter>{actions}</EmptyStateFooter>
  </EmptyState>
);

export { EmptyWithAction };
