/**
 * Federated Modules
 *
 * This directory contains all components exposed via module federation.
 * Each module is self-contained with its own providers and can be used by external
 * consumers without any additional setup.
 *
 * Each module (except Iam) has an associated .stories.tsx file that tests it with
 * `noWrapping: true` to validate it works without Storybook's context providers.
 */

export { default as Iam } from './Iam';
export { default as CreateWorkspaceWizard } from './CreateWorkspaceWizard';
export { default as WorkspaceSelector } from './WorkspaceSelector';
