import React from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

/**
 * QuickstartsTest Component
 *
 * This component renders the PatternFly Quickstarts Catalog, which provides
 * guided tutorials and onboarding experiences for users. Quickstarts help
 * users learn features through step-by-step interactive tutorials.
 *
 * Features:
 * - Displays available quickstart tutorials in a card-based catalog view
 * - Provides filtering and search capabilities
 * - Tracks user progress through tutorials
 * - Supports different difficulty levels and categories
 *
 * @example
 * // Basic usage
 * <QuickstartsTest />
 */
export const QuickstartsTest: React.FC = () => {
  const chrome = useChrome();
  const { quickStarts } = chrome;
  const { Catalog } = quickStarts;

  return <Catalog />;
};

export default QuickstartsTest;
