import React, { LegacyRef } from 'react';
import { Link, LinkProps, To } from 'react-router-dom';
import { useAppLink } from '../../hooks/useAppLink';

interface AppLinkProps extends LinkProps {
  to: To;
}

const AppLink: React.FC<React.PropsWithChildren<AppLinkProps & { className?: string }>> = React.forwardRef(
  (props: React.PropsWithChildren<AppLinkProps>, ref: LegacyRef<HTMLSpanElement>) => {
    const toAppLink = useAppLink();
    const to = toAppLink(props.to);
    return (
      <span ref={ref}>
        <Link {...props} to={to} />
      </span>
    );
  },
);

AppLink.displayName = 'AppLink';

export { AppLink };
