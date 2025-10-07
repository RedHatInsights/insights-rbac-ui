import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fake address bar component to show current route in Storybook
 */
export const FakeAddressBar: React.FC = () => {
  const location = useLocation();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#f5f5f5',
        border: '1px solid #ccc',
        padding: '8px 16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ color: '#666', marginRight: '8px' }}>🌐</span>
      <span style={{ fontWeight: 'bold' }}>URL:</span> <span style={{ color: '#0066cc' }}>{location.pathname}</span>
      {location.search && <span style={{ color: '#666' }}>{location.search}</span>}
    </div>
  );
};
