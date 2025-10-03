import React, { LegacyRef } from 'react';
import { Link, LinkProps, To } from 'react-router-dom';
import { useAppLink } from '../../hooks/useAppLink';

interface AppLinkProps extends LinkProps {
  linkBasename?: string;
  to: To;
}

const AppLink: React.FC<React.PropsWithChildren<AppLinkProps & { className?: string }>> = React.forwardRef(
  (props: React.PropsWithChildren<AppLinkProps>, ref: LegacyRef<HTMLSpanElement>) => {
    const toAppLink = useAppLink();
    const { linkBasename, ...linkProps } = props;
    const to = toAppLink(props.to, linkBasename);
    return (
      <span ref={ref}>
        <Link {...linkProps} to={to} />
      </span>
    );
  },
);

AppLink.displayName = 'AppLink';

export { AppLink };
