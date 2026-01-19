/**
 * Shape of API error responses we expect to handle
 */
interface ApiErrorResponse {
  errors?: Array<{ detail?: string }>;
  detail?: string;
  message?: string;
}

/**
 * Type guard to check if error has the expected shape
 */
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === 'object' && error !== null;
}

/**
 * Extracts user-friendly error messages from API error responses
 * Filters out technical messages like axios errors and provides fallbacks
 */
export const extractErrorMessage = (error: unknown): string => {
  // Default fallback message
  const defaultMessage = 'Something went wrong. Please try again.';

  if (!error || !isApiErrorResponse(error)) {
    return defaultMessage;
  }

  if (error.errors && error.errors.length > 0) {
    // API error format: { errors: [{ detail: "message" }] }
    return error.errors[0].detail || defaultMessage;
  }

  if (error.detail) {
    // Direct error format: { detail: "message" }
    return error.detail;
  }

  if (error.message && !error.message.includes('status code')) {
    // Only use error.message if it's not an axios error
    return error.message;
  }

  // Fallback for any other case (including axios errors)
  return defaultMessage;
};
