import React from 'react';
import { useLocation } from 'react-router-dom';

/** Height of the address bar including padding and border */
const ADDRESS_BAR_HEIGHT = 38;

/**
 * Fake address bar component to show current route in Storybook.
 * Renders a fixed bar at the top plus a spacer to push content down.
 */
export const FakeAddressBar: React.FC = () => {
  const location = useLocation();
  return (
    <>
      {/* Fixed address bar */}
      <div
        data-testid="fake-address-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: ADDRESS_BAR_HEIGHT,
          zIndex: 9999,
          background: 'var(--pf-t--global--background--color--secondary--default)',
          borderBottom: '1px solid var(--pf-t--global--border--color--default)',
          padding: '8px 16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          boxShadow: 'var(--pf-t--global--box-shadow--sm)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ color: 'var(--pf-t--global--text--color--subtle)', marginRight: '8px' }}>🌐</span>
        <span style={{ fontWeight: 'bold' }}>URL:</span>{' '}
        <span style={{ color: 'var(--pf-t--global--color--brand--default)' }}>{location.pathname}</span>
        {location.search && <span style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>{location.search}</span>}
      </div>
      {/* Spacer to push page content below the fixed bar */}
      <div style={{ height: ADDRESS_BAR_HEIGHT }} />
    </>
  );
};
