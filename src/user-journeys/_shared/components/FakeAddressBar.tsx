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
          background: '#f5f5f5',
          borderBottom: '1px solid #ccc',
          padding: '8px 16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ color: '#666', marginRight: '8px' }}>🌐</span>
        <span style={{ fontWeight: 'bold' }}>URL:</span> <span style={{ color: '#0066cc' }}>{location.pathname}</span>
        {location.search && <span style={{ color: '#666' }}>{location.search}</span>}
      </div>
      {/* Spacer to push page content below the fixed bar */}
      <div style={{ height: ADDRESS_BAR_HEIGHT }} />
    </>
  );
};
