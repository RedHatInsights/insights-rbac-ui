import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

/**
 * ExternalLink - for navigation to paths outside this application.
 *
 * Use this for paths that are handled by other apps mounted under /iam
 * or other platform paths like /settings, /service-accounts, etc.
 *
 * For internal navigation within this app, use:
 * - <AppLink> component with pathnames from src/utilities/pathnames.ts
 *
 * @example
 * <ExternalLink to="/service-accounts">Service Accounts</ExternalLink>
 * <ExternalLink to="/settings/integrations">Integrations</ExternalLink>
 */
export const ExternalLink: React.FC<LinkProps> = (props) => {
  return <Link {...props} />;
};

export default ExternalLink;
