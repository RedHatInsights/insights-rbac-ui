import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Left navigation panel component for Kessel (Workspaces) journey tests
 * This is a separate component from LeftNavigation to keep Kessel-specific navigation isolated
 */
export const KesselNavigation: React.FC = () => {
  const location = useLocation();
  const [isUserAccessExpanded, setIsUserAccessExpanded] = React.useState(true);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="pf-v6-c-nav">
      <ul className="pf-v6-c-nav__list" role="list">
        {/* My User Access */}
        <li className="pf-v6-c-nav__item">
          <Link
            to="/iam/my-user-access"
            className="pf-v6-c-nav__link"
            style={{
              display: 'block',
              padding: '8px 16px',
              color: isActive('/iam/my-user-access') ? '#73bcf7' : '#fff',
              textDecoration: 'none',
              backgroundColor: isActive('/iam/my-user-access') ? '#1f1f1f' : 'transparent',
            }}
          >
            <span className="pf-v6-c-nav__link-text">My User Access</span>
          </Link>
        </li>

        {/* User Access (Expandable) */}
        <li className="pf-v6-c-nav__item">
          <button
            className="pf-v6-c-nav__link"
            onClick={() => setIsUserAccessExpanded(!isUserAccessExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 16px',
              color: '#fff',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            User Access
            <span style={{ transform: isUserAccessExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
          </button>
          {isUserAccessExpanded && (
            <section className="pf-v6-c-nav__subnav">
              <ul className="pf-v6-c-nav__list" role="list" style={{ paddingLeft: '16px' }}>
                <li className="pf-v6-c-nav__item">
                  <Link
                    to="/iam/user-access/overview"
                    className="pf-v6-c-nav__link"
                    style={{
                      display: 'block',
                      padding: '8px 16px',
                      color: isActive('/iam/user-access/overview') ? '#73bcf7' : '#fff',
                      textDecoration: 'none',
                      backgroundColor: isActive('/iam/user-access/overview') ? '#1f1f1f' : 'transparent',
                    }}
                  >
                    <span className="pf-v6-c-nav__link-text">Overview</span>
                  </Link>
                </li>
                <li className="pf-v6-c-nav__item">
                  <Link
                    to="/iam/user-access/users"
                    className="pf-v6-c-nav__link"
                    style={{
                      display: 'block',
                      padding: '8px 16px',
                      color: isActive('/iam/user-access/users') ? '#73bcf7' : '#fff',
                      textDecoration: 'none',
                      backgroundColor: isActive('/iam/user-access/users') ? '#1f1f1f' : 'transparent',
                    }}
                  >
                    <span className="pf-v6-c-nav__link-text">Users</span>
                  </Link>
                </li>
                <li className="pf-v6-c-nav__item">
                  <Link
                    to="/iam/user-access/roles"
                    className="pf-v6-c-nav__link"
                    style={{
                      display: 'block',
                      padding: '8px 16px',
                      color: isActive('/iam/user-access/roles') ? '#73bcf7' : '#fff',
                      textDecoration: 'none',
                      backgroundColor: isActive('/iam/user-access/roles') ? '#1f1f1f' : 'transparent',
                    }}
                  >
                    <span className="pf-v6-c-nav__link-text">Roles</span>
                  </Link>
                </li>
                <li className="pf-v6-c-nav__item">
                  <Link
                    to="/iam/user-access/groups"
                    className="pf-v6-c-nav__link"
                    style={{
                      display: 'block',
                      padding: '8px 16px',
                      color: isActive('/iam/user-access/groups') ? '#73bcf7' : '#fff',
                      textDecoration: 'none',
                      backgroundColor: isActive('/iam/user-access/groups') ? '#1f1f1f' : 'transparent',
                    }}
                  >
                    <span className="pf-v6-c-nav__link-text">Groups</span>
                  </Link>
                </li>
              </ul>
            </section>
          )}
        </li>

        {/* Workspaces (Kessel) */}
        <li className="pf-v6-c-nav__item">
          <Link
            to="/iam/access-management/workspaces"
            className="pf-v6-c-nav__link"
            style={{
              display: 'block',
              padding: '8px 16px',
              color: isActive('/iam/access-management/workspaces') ? '#73bcf7' : '#fff',
              textDecoration: 'none',
              backgroundColor: isActive('/iam/access-management/workspaces') ? '#1f1f1f' : 'transparent',
            }}
          >
            <span className="pf-v6-c-nav__link-text">Workspaces</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
