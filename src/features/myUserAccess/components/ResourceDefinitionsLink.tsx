import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface ResourceDefinition {
  attributeFilter?: {
    value: string | string[] | null;
    key?: string;
    operation?: string;
  };
}

interface Access {
  resourceDefinitions: ResourceDefinition[];
}

interface ResourceDefinitionsLinkProps {
  onClick: () => void;
  access: Access;
}

const ResourceDefinitionsLink: React.FC<ResourceDefinitionsLinkProps> = ({ onClick, access }) => {
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

export default ResourceDefinitionsLink;
