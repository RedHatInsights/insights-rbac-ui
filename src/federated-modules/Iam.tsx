/**
 * Iam - Federated Module
 *
 * Main IAM application entry point for module federation.
 * This component is fully self-contained with all required providers.
 *
 * ```tsx
 * <AsyncComponent
 *   scope="rbac"
 *   module="./Iam"
 *   fallback={<AppPlaceholder />}
 * />
 * ```
 *
 * Providers included:
 * - IntlMessagesProvider (loads the selected locale catalog)
 * - AccessCheck.Provider (Kessel)
 * - NotificationsProvider (toast notifications)
 * - ApiErrorProvider (error state management)
 * - ServiceProvider (axios, notify)
 * - QueryClientSetup (React Query)
 */

export { Iam as default, type IamProps } from '../Iam';
