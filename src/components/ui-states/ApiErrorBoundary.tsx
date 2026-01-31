/**
 * API Error Boundary - Error UI Component
 *
 * Renders error UI (403/500) based on ApiErrorContext state.
 * Clears errors on navigation.
 *
 * Note: This component only handles UI rendering. Error state management
 * is in ApiErrorContext, and QueryClient setup is in QueryClientSetup.
 */

import React, { type ReactNode, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import UnavailableContent from '@patternfly/react-component-groups/dist/dynamic/UnavailableContent';
import { AppLink } from '../navigation/AppLink';

import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { useApiError } from '../../contexts/ApiErrorContext';

// Re-export for backward compatibility
export { useApiError } from '../../contexts/ApiErrorContext';
export type { ApiErrorCode } from '../../contexts/ApiErrorContext';

// ============================================================================
// Error States UI
// ============================================================================

const errorStates: Record<number, React.FC<{ serviceName: string }>> = {
  403: ({ serviceName }) => (
    <UnauthorizedAccess
      data-codemods
      serviceName={serviceName}
      bodyText={
        <FormattedMessage
          {...messages.contactOrgAdmin}
          values={{
            link: <AppLink to={pathnames['my-user-access'].link()}>My User Access</AppLink>,
          }}
        />
      }
    />
  ),
  500: ({ serviceName }) => (
    <UnavailableContent
      data-codemods
      headingLevel="h1"
      titleText={`${serviceName} is temporarily unavailable`}
      bodyText="We're working to restore service. Please try again later."
    />
  ),
};

// ============================================================================
// Error Boundary Component
// ============================================================================

interface ApiErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Renders error UI when API errors (403/500) are detected.
 * Clears errors automatically on route navigation.
 *
 * Must be used within:
 * - ApiErrorProvider (for error state)
 * - Router (for useLocation)
 * - IntlProvider (for messages)
 *
 * Usage:
 * ```tsx
 * <ApiErrorProvider>
 *   <QueryClientSetup>
 *     <ApiErrorBoundary>
 *       <App />
 *     </ApiErrorBoundary>
 *   </QueryClientSetup>
 * </ApiErrorProvider>
 * ```
 */
export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({ children }) => {
  const { errorCode, clearError } = useApiError();
  const location = useLocation();
  const intl = useIntl();

  // Clear error on navigation
  useEffect(() => {
    clearError();
  }, [location?.pathname, clearError]);

  const sectionTitles: Record<string, string> = {
    '/users': intl.formatMessage(messages.rbacUsers),
    '/groups': intl.formatMessage(messages.rbacGroups),
  };

  // Render error state if we have one
  if (errorCode) {
    const State = errorStates[errorCode];
    const name = sectionTitles[Object.keys(sectionTitles).find((key) => location?.pathname.includes(key)) || ''] || 'RBAC';

    if (State) {
      return <State serviceName={name} />;
    }
  }

  return <>{children}</>;
};

export default ApiErrorBoundary;
