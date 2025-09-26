/**
 * Common TypeScript interfaces for Data-Driven Forms components
 * This file provides proper typing for form field components to replace `any` types
 */

import type { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';

/**
 * Base interface for components that use useFieldApi hook
 * Extends UseFieldApiConfig with common component props
 */
export interface DataDrivenFormFieldProps extends UseFieldApiConfig {
  name: string;
}

/**
 * Props for form field components that don't require additional specific props
 * Use this for simple field components
 */
export interface BasicFieldProps extends DataDrivenFormFieldProps {
  // Intentionally minimal - specific components can extend this
}

/**
 * Props for form step components in wizards
 * These components typically don't use useFieldApi directly but receive the field props
 */
export interface FormStepProps extends DataDrivenFormFieldProps {
  // Common props for wizard steps
}
