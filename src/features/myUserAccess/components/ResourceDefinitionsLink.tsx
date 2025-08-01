import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { ResourceDefinition } from '../types';

interface Access {
  resourceDefinitions: ResourceDefinition[];
}

interface ResourceDefinitionsLinkProps {
  onClick: () => void;
  access: Access;
}

export const ResourceDefinitionsLink: React.FC<ResourceDefinitionsLinkProps> = ({ onClick, access }) => {
  const intl = useIntl();

  return access.resourceDefinitions.length === 0 ? (
    <span>{intl.formatMessage(messages.notApplicable)}</span>
  ) : (
    <a
      onClick={() => {
        onClick();
        return false;
      }}
    >
      {access.resourceDefinitions.length}
    </a>
  );
};
