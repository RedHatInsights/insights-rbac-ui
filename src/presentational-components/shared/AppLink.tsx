import React, { LegacyRef } from 'react';
import { Link, LinkProps, To } from 'react-router-dom';

interface AppLinkProps extends LinkProps {
  linkBasename?: string;
}

export const mergeToBasename = (to: To, basename = '/iam/user-access') => {
  if (typeof to === 'string') {
    // replace possible "//" after basename
    return `${basename}/${to}`.replaceAll('//', '/');
  }

  return {
    ...to,
    pathname: `${basename}/${to.pathname}`.replaceAll('//', '/'),
  };
};

const AppLink: React.FC<AppLinkProps> = React.forwardRef((props: AppLinkProps, ref: LegacyRef<HTMLSpanElement>) => (
  <span ref={ref}>
    <Link {...props} to={mergeToBasename(props.to, props.linkBasename)} />
  </span>
));

AppLink.displayName = 'AppLink';

export default AppLink;
