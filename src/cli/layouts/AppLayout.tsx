import React, { type ReactNode, useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { useLocation, useNavigate } from 'react-router-dom';

// ============================================================================
// Constants
// ============================================================================

export const colors = {
  primary: '#00A4FF',
  success: '#3E8635',
  danger: '#C9190B',
  warning: '#F0AB00',
  muted: '#6A6E73',
  highlight: '#06C',
  cyan: '#00BCD4',
  purple: '#8A508F',
};

// ============================================================================
// Status Context
// ============================================================================

interface StatusState {
  message: string | null;
  type: 'success' | 'error' | 'info';
}

const StatusContext = React.createContext<{
  status: StatusState;
  setStatus: (status: StatusState) => void;
} | null>(null);

export function useStatus() {
  const context = React.useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within AppLayout');
  }
  return context;
}

// ============================================================================
// Header Component
// ============================================================================

function Header(): React.ReactElement {
  const location = useLocation();

  // Determine title from pathname
  const getTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Home';

    const entity = parts[0];
    const entityTitle = entity.charAt(0).toUpperCase() + entity.slice(1);

    if (parts.length === 1) {
      return entityTitle;
    }

    // Detail view
    return `${entityTitle} > Detail`;
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={colors.primary} bold>
        ╔══════════════════════════════════════════════════════════════════════════════╗
      </Text>
      <Text color={colors.primary} bold>
        ║ RBAC CLI │ {getTitle().padEnd(55)}║
      </Text>
      <Text color={colors.primary} bold>
        ╚══════════════════════════════════════════════════════════════════════════════╝
      </Text>
    </Box>
  );
}

// ============================================================================
// Status Bar Component
// ============================================================================

function StatusBar({ status }: { status: StatusState }): React.ReactElement | null {
  if (!status.message) return null;
  const color = status.type === 'success' ? colors.success : status.type === 'error' ? colors.danger : colors.cyan;
  const icon = status.type === 'success' ? '✓' : status.type === 'error' ? '✗' : 'ℹ';
  return (
    <Box marginBottom={1}>
      <Text color={color}>
        {icon} {status.message}
      </Text>
    </Box>
  );
}

// ============================================================================
// Navigation Help
// ============================================================================

function NavigationHelp(): React.ReactElement {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isListView = pathParts.length === 1;
  const isUsersView = pathParts[0] === 'users';

  if (isListView) {
    return (
      <Box marginTop={1} flexDirection="column">
        <Box gap={2} flexWrap="wrap">
          <Text color={colors.muted}>
            <Text bold color={colors.highlight}>
              ↑/↓
            </Text>{' '}
            Navigate
          </Text>
          <Text color={colors.muted}>
            <Text bold color={colors.highlight}>
              ←/→
            </Text>{' '}
            Page
          </Text>
          {!isUsersView && (
            <Text color={colors.muted}>
              <Text bold color={colors.highlight}>
                Enter
              </Text>{' '}
              Details
            </Text>
          )}
          <Text color={colors.muted}>
            <Text bold color={colors.cyan}>
              /
            </Text>{' '}
            Search
          </Text>
          {!isUsersView && (
            <Text color={colors.muted}>
              <Text bold color={colors.success}>
                N
              </Text>{' '}
              New
            </Text>
          )}
          {!isUsersView && (
            <Text color={colors.muted}>
              <Text bold color={colors.danger}>
                D
              </Text>{' '}
              Delete
            </Text>
          )}
          <Text color={colors.muted}>
            <Text bold color={colors.primary}>
              R
            </Text>{' '}
            Refresh
          </Text>
        </Box>
        <Box gap={2} marginTop={1}>
          <Text color={colors.muted}>
            <Text bold color={colors.warning}>
              1
            </Text>{' '}
            Roles
          </Text>
          <Text color={colors.muted}>
            <Text bold color={colors.warning}>
              2
            </Text>{' '}
            Groups
          </Text>
          <Text color={colors.muted}>
            <Text bold color={colors.warning}>
              3
            </Text>{' '}
            Workspaces
          </Text>
          <Text color={colors.muted}>
            <Text bold color={colors.warning}>
              4
            </Text>{' '}
            Users
          </Text>
          <Text color={colors.muted}>
            <Text bold>Q</Text> Quit
          </Text>
        </Box>
      </Box>
    );
  }

  // Detail view
  return (
    <Box marginTop={1} flexDirection="column">
      <Box gap={2}>
        <Text color={colors.muted}>
          <Text bold color={colors.warning}>
            Esc
          </Text>{' '}
          Back
        </Text>
        <Text color={colors.muted}>
          <Text bold color={colors.highlight}>
            1-4
          </Text>{' '}
          Tabs
        </Text>
        <Text color={colors.muted}>
          <Text bold color={colors.cyan}>
            E
          </Text>{' '}
          Edit
        </Text>
        <Text color={colors.muted}>
          <Text bold color={colors.danger}>
            D
          </Text>{' '}
          Delete
        </Text>
        <Text color={colors.muted}>
          <Text bold color={colors.primary}>
            R
          </Text>{' '}
          Refresh
        </Text>
      </Box>
    </Box>
  );
}

// ============================================================================
// Global Navigation Handler
// ============================================================================

function GlobalNavigation({ children }: { children: ReactNode }): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { exit } = useApp();

  const isListView = location.pathname.split('/').filter(Boolean).length === 1;

  useInput((input, key) => {
    // Escape to go back
    if (key.escape) {
      navigate(-1);
      return;
    }

    // Quit
    if (input.toLowerCase() === 'q') {
      exit();
      return;
    }

    // Entity switching only in list views
    if (isListView) {
      if (input === '1') {
        navigate('/roles');
      } else if (input === '2') {
        navigate('/groups');
      } else if (input === '3') {
        navigate('/workspaces');
      } else if (input === '4') {
        navigate('/users');
      }
    }
  });

  return <>{children}</>;
}

// ============================================================================
// Main Layout
// ============================================================================

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): React.ReactElement {
  const [status, setStatus] = useState<StatusState>({ message: null, type: 'info' });

  // Auto-clear status after delay
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ message: null, type: 'info' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  return (
    <StatusContext.Provider value={{ status, setStatus }}>
      <GlobalNavigation>
        <Box flexDirection="column">
          <Header />
          <StatusBar status={status} />
          {children}
          <NavigationHelp />
        </Box>
      </GlobalNavigation>
    </StatusContext.Provider>
  );
}
