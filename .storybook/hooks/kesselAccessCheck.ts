/**
 * Storybook mock for @project-kessel/react-kessel-access-check
 *
 * Re-exports context-aware mock versions of the Kessel access check hooks.
 * This file is aliased via webpack in main.ts to replace the real package.
 */
import { AccessCheck, useSelfAccessCheck } from '../context-providers';

export { AccessCheck, useSelfAccessCheck };
