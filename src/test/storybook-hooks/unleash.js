import { useFlag } from '../storybook-context-providers';

// Export the context-aware version and any other unleash exports that might be used
export { useFlag };

// In case there are other exports we need to mock, provide a minimal implementation
export const FlagProvider = ({ children }) => children;
export const UnleashClient = class {};
export const useUnleashContext = () => ({});
export const useVariant = () => ({ name: 'disabled', enabled: false });
