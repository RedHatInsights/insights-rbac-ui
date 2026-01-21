import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from '../../layouts/AppLayout.js';

// ============================================================================
// Spinner
// ============================================================================

export function Spinner(): React.ReactElement {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, [frames.length]);

  return <Text color={colors.primary}>{frames[frame]}</Text>;
}

// ============================================================================
// Loading State
// ============================================================================

export function Loading({ message = 'Loading...' }: { message?: string }): React.ReactElement {
  return (
    <Box>
      <Spinner />
      <Text> {message}</Text>
    </Box>
  );
}

// ============================================================================
// Error State
// ============================================================================

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }): React.ReactElement {
  useInput((input) => {
    if (input.toLowerCase() === 'r' && onRetry) {
      onRetry();
    }
  });

  return (
    <Box flexDirection="column">
      <Text color={colors.danger}>✗ {message}</Text>
      {onRetry && <Text color={colors.muted}>Press R to retry</Text>}
    </Box>
  );
}

// ============================================================================
// Empty State
// ============================================================================

export function EmptyState({ message }: { message: string }): React.ReactElement {
  return <Text color={colors.muted}>{message}</Text>;
}

// ============================================================================
// Pagination
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
}

export function Pagination({ page, totalPages, totalItems }: PaginationProps): React.ReactElement {
  return (
    <Box marginTop={1}>
      <Text color={colors.muted}>
        Page {page + 1} of {Math.max(1, totalPages)} • {totalItems} total
      </Text>
    </Box>
  );
}

// ============================================================================
// Tab Bar
// ============================================================================

interface TabBarProps {
  tabs: string[];
  activeIndex: number;
}

export function TabBar({ tabs, activeIndex }: TabBarProps): React.ReactElement {
  return (
    <Box marginBottom={1} gap={1}>
      {tabs.map((tab, i) => (
        <Text
          key={tab}
          backgroundColor={activeIndex === i ? colors.primary : undefined}
          color={activeIndex === i ? '#FFFFFF' : colors.muted}
          bold={activeIndex === i}
        >
          {' '}
          [{i + 1}] {tab}{' '}
        </Text>
      ))}
    </Box>
  );
}

// ============================================================================
// Search Input
// ============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function SearchInput({ value, onChange, onSubmit, onCancel }: SearchInputProps): React.ReactElement {
  useInput((_, key) => {
    if (key.return) {
      onSubmit();
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box marginBottom={1}>
      <Text color={colors.cyan}>🔍 Search: </Text>
      <TextInput value={value} onChange={onChange} />
    </Box>
  );
}

// ============================================================================
// Confirm Dialog
// ============================================================================

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps): React.ReactElement {
  useInput((input, key) => {
    if (input.toLowerCase() === 'y') {
      onConfirm();
    } else if (input.toLowerCase() === 'n' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box padding={1} borderStyle="single" borderColor={colors.danger}>
      <Text color={colors.danger} bold>
        {message} (Y/N)
      </Text>
    </Box>
  );
}

// ============================================================================
// Form Input
// ============================================================================

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  focused: boolean;
}

export function FormField({ label, value, onChange, focused }: FormFieldProps): React.ReactElement {
  return (
    <Box>
      <Text color={focused ? colors.highlight : colors.muted}>{label}: </Text>
      {focused ? <TextInput value={value} onChange={onChange} /> : <Text>{value || '(empty)'}</Text>}
    </Box>
  );
}

// ============================================================================
// Entity Form (Create/Edit)
// ============================================================================

interface EntityFormProps {
  title: string;
  fields: { name: string; description: string };
  onChange: (field: 'name' | 'description', value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EntityForm({ title, fields, onChange, onSubmit, onCancel }: EntityFormProps): React.ReactElement {
  const [focusField, setFocusField] = useState<'name' | 'description'>('name');

  useInput((_, key) => {
    if (key.tab || key.downArrow) {
      setFocusField(focusField === 'name' ? 'description' : 'name');
    } else if (key.upArrow) {
      setFocusField(focusField === 'description' ? 'name' : 'description');
    } else if (key.return) {
      onSubmit();
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="single" borderColor={colors.success}>
      <Text bold color={colors.success}>
        {title}
      </Text>
      <Box marginTop={1}>
        <FormField label="Name" value={fields.name} onChange={(v) => onChange('name', v)} focused={focusField === 'name'} />
      </Box>
      <Box>
        <FormField label="Desc" value={fields.description} onChange={(v) => onChange('description', v)} focused={focusField === 'description'} />
      </Box>
      <Text color={colors.muted} marginTop={1}>
        Tab/↑↓ to switch • Enter to save • Esc to cancel
      </Text>
    </Box>
  );
}

// ============================================================================
// Preview Panel
// ============================================================================

interface PreviewPanelProps {
  title: string;
  children: React.ReactNode;
}

export function PreviewPanel({ title, children }: PreviewPanelProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor={colors.primary} padding={1} flexDirection="column">
      <Text bold color={colors.primary}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

// ============================================================================
// Detail Field
// ============================================================================

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
}

export function DetailField({ label, value }: DetailFieldProps): React.ReactElement {
  return (
    <Text>
      <Text bold>{label}:</Text> {value}
    </Text>
  );
}
