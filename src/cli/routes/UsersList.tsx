import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useInputFocus, useStatus } from '../layouts/AppLayout.js';
import { DetailField, EmptyState, ErrorMessage, Loading, Pagination, PreviewPanel, SearchInput } from '../components/shared/index.js';
import { type User, useUsersQuery } from '../queries.js';

const PAGE_SIZE = 12;

interface UsersListProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'search';

export function UsersList({ queryClient }: UsersListProps): React.ReactElement {
  const { setStatus } = useStatus();

  // State
  const [mode, setMode] = useState<Mode>('browse');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Disable global hotkeys when in text input mode
  const { setInputFocused } = useInputFocus();
  useEffect(() => {
    setInputFocused(mode === 'search');
    return () => setInputFocused(false);
  }, [mode, setInputFocused]);

  // Queries
  const usersQuery = useUsersQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, username: searchTerm || undefined }, { queryClient });

  // Note: User status/admin mutations use IT API which requires browser-specific config (useChrome)
  // These are not available in CLI

  // Computed
  const usersList = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedUser = usersList[selectedIndex] as User | undefined;

  // Input handling - only handle non-text keys when in search mode
  useInput((input, key) => {
    // In search mode, only handle special keys - let TextInput handle text
    if (mode === 'search') {
      return;
    }

    // Browse mode
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(usersList.length - 1, prev + 1));
    } else if (key.leftArrow) {
      setPage((prev) => Math.max(0, prev - 1));
      setSelectedIndex(0);
    } else if (key.rightArrow) {
      setPage((prev) => Math.min(totalPages - 1, prev + 1));
      setSelectedIndex(0);
    } else if (input === '/') {
      setSearchInput(searchTerm);
      setMode('search');
    } else if (input.toLowerCase() === 'r') {
      usersQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Render
  if (usersQuery.isError) {
    return <ErrorMessage message="Failed to load users" onRetry={() => usersQuery.refetch()} />;
  }

  return (
    <Box flexDirection="row">
      {/* List Panel */}
      <Box flexDirection="column" width="60%">
        {mode === 'search' && (
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => {
              setSearchTerm(searchInput);
              setPage(0);
              setSelectedIndex(0);
              setMode('browse');
            }}
            onCancel={() => setMode('browse')}
          />
        )}

        {mode === 'browse' && (
          <>
            {usersQuery.isLoading ? (
              <Loading message="Loading users..." />
            ) : usersList.length === 0 ? (
              <EmptyState message="No users found" />
            ) : (
              usersList.map((user, i) => <UserRow key={user.username} user={user} isSelected={i === selectedIndex} />)
            )}
            <Pagination page={page} totalPages={totalPages} totalItems={totalCount} />
          </>
        )}
      </Box>

      {/* Preview Panel */}
      <Box flexDirection="column" width="40%" paddingLeft={1}>
        {selectedUser ? (
          <PreviewPanel title="Preview">
            <DetailField label="Username" value={selectedUser.username} />
            <DetailField label="Email" value={selectedUser.email || '—'} />
            <Text>
              <Text bold>Status:</Text>{' '}
              <Text color={selectedUser.is_active ? colors.success : colors.danger}>{selectedUser.is_active ? 'Active' : 'Inactive'}</Text>
            </Text>
            <DetailField label="Admin" value={selectedUser.is_org_admin ? 'Yes' : 'No'} />
          </PreviewPanel>
        ) : (
          <PreviewPanel title="Preview">
            <Text color={colors.muted}>Select a user to preview</Text>
          </PreviewPanel>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// Row Component
// ============================================================================

function UserRow({ user, isSelected }: { user: User; isSelected: boolean }): React.ReactElement {
  return (
    <Box>
      <Text backgroundColor={isSelected ? colors.highlight : undefined} color={isSelected ? '#FFFFFF' : undefined}>
        {isSelected ? '▸ ' : '  '}
        <Text bold>{user.username.slice(0, 25).padEnd(25)}</Text>
        <Text color={isSelected ? '#FFFFFF' : colors.muted}> {user.email?.slice(0, 30).padEnd(30)}</Text>
        <Text color={user.is_active ? colors.success : colors.danger}> {user.is_active ? 'Active' : 'Inactive'}</Text>
        {user.is_org_admin && <Text color={colors.warning}> [admin]</Text>}
      </Text>
    </Box>
  );
}
