import { useState } from 'react';

/**
 * Custom hook for managing Group component local state
 * Handles modal visibility and dropdown states
 */
export const useGroupState = () => {
  // Modal and dialog states
  const [isResetWarningVisible, setResetWarningVisible] = useState<boolean>(false);
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);

  return {
    // Reset warning modal
    isResetWarningVisible,
    setResetWarningVisible,

    // Actions dropdown
    isDropdownOpen,
    setDropdownOpen,
  };
};
