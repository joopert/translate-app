import { ref } from 'vue';
import { z } from 'zod';
import { zDetail, zErrorLocation, zErrorLocationField } from '~/api-client/zod.gen';

interface AlertMessage {
  type: 'success' | 'info' | 'warning' | 'danger';
  category?: string;
  message: string;
}

interface FormErrorHandler {
  // Handle API response errors
  handleResponseError: (error: any) => void;
  // General error handler for other contexts
  handleError: (error: any) => void;
  // Alert message ref for UI display
  alertMessage: Ref<AlertMessage | null>;
  // Clear any displayed error message
  clearError: () => void;
}

/**
 * Composable for handling API errors in forms
 * Designed to work with SDK's onresponseerror callback
 */
export function useFormErrorHandler(options: {
  form?: any; // Should be a vee-validate form instance
}): FormErrorHandler {
  const { form } = options;
  const alertMessage = ref<AlertMessage | null>(null);

  /**
   * Helper to create an alert message
   */
  const createAlert = (type: AlertMessage['type'], category: string, message: string) => {
    alertMessage.value = { type, category, message };
  };

  /**
   * Clear the current error message
   */
  const clearError = () => {
    alertMessage.value = null;
  };

  // Schema for response with detail field containing a Detail object
  const responseWithDetailSchema = z.object({
    detail: zDetail,
  });

  /**
   * Process API errors and set form field errors
   * Designed to be used with onResponseError in API calls
   */
  const handleResponseError = (error: any) => {
    // If no response data, treat as connection error
    if (!error.response) {
      createAlert('danger', 'CONNECTION_ERROR', 'Network error. Please check your connection.');
      return error;
    }

    const errorData = error.response._data;

    try {
      // Parse as an object with detail field (primary format from backend)
      const detailResult = responseWithDetailSchema.safeParse(errorData);
      if (detailResult.success) {
        const detail = detailResult.data.detail;

        // Check if it's a general error (not tied to a specific field)
        if (
          detail.loc === 'general' ||
          (typeof detail.loc === 'string' && zErrorLocationField.safeParse(detail.loc).success)
        ) {
          // General error, just show the alert
          createAlert('danger', detail.code, detail.msg);
          return error;
        }

        // Handle field-specific errors if we have a form
        if (form && Array.isArray(detail.loc) && detail.loc.length > 1) {
          // Try to validate if first element is a known ErrorLocation
          const locFirstElement = detail.loc[0] as string;
          const isLocationEnum = zErrorLocation.safeParse(locFirstElement).success;

          if (isLocationEnum && locFirstElement === 'body' && typeof detail.loc[1] === 'string') {
            const fieldName = detail.loc[1];

            // Set field error using vee-validate's methods
            if (typeof form.setFieldError === 'function') {
              form.setFieldError(fieldName, detail.msg);
            } else if (typeof form.setErrors === 'function') {
              form.setErrors({
                [fieldName]: detail.msg,
              });
            }

            // Still show an alert for accessibility reasons
            createAlert('danger', detail.code, detail.msg);
            return error;
          }
        }

        // General error (non-field specific)
        createAlert('danger', detail.code, detail.msg);
        return error;
      }

      // If not a detail object, check if it's a raw Detail object without wrapper
      const directDetailResult = zDetail.safeParse(errorData);
      if (directDetailResult.success) {
        const detail = directDetailResult.data;

        // Check if it's a general error (not tied to a specific field)
        if (
          detail.loc === 'general' ||
          (typeof detail.loc === 'string' && zErrorLocationField.safeParse(detail.loc).success)
        ) {
          // General error, just show the alert
          createAlert('danger', detail.code, detail.msg);
          return error;
        }

        // Handle field-specific errors if we have a form
        if (form && Array.isArray(detail.loc) && detail.loc.length > 1) {
          // Try to validate if first element is a known ErrorLocation
          const locFirstElement = detail.loc[0] as string;
          const isLocationEnum = zErrorLocation.safeParse(locFirstElement).success;

          if (isLocationEnum && locFirstElement === 'body' && typeof detail.loc[1] === 'string') {
            const fieldName = detail.loc[1];

            // Set field error using vee-validate's methods
            if (typeof form.setFieldError === 'function') {
              form.setFieldError(fieldName, detail.msg);
            } else if (typeof form.setErrors === 'function') {
              form.setErrors({
                [fieldName]: detail.msg,
              });
            }

            // Still show an alert for accessibility reasons
            createAlert('danger', detail.code, detail.msg);
            return error;
          }
        }

        // General error (non-field specific)
        createAlert('danger', detail.code, detail.msg);
        return error;
      }

      // If it's possibly an array of Detail objects (for bulk validation errors)
      const arrayResult = z.array(zDetail).safeParse(errorData);
      if (arrayResult.success) {
        const details = arrayResult.data;
        const fieldErrors: Record<string, string> = {};

        // Process each validation error
        details.forEach(detail => {
          // Check for general errors first
          if (
            detail.loc === 'general' ||
            (typeof detail.loc === 'string' && zErrorLocationField.safeParse(detail.loc).success)
          ) {
            // General error, just show the alert
            createAlert('danger', detail.code, detail.msg);
            return;
          }

          if (Array.isArray(detail.loc) && detail.loc.length > 1) {
            // Try to validate if first element is a known ErrorLocation
            const locFirstElement = detail.loc[0] as string;
            const isLocationEnum = zErrorLocation.safeParse(locFirstElement).success;

            if (isLocationEnum && locFirstElement === 'body' && typeof detail.loc[1] === 'string') {
              const fieldName = detail.loc[1];
              fieldErrors[fieldName] = detail.msg;

              // Also set individual field errors if we can
              if (form && typeof form.setFieldError === 'function') {
                form.setFieldError(fieldName, detail.msg);
              }
            } else {
              // General error
              createAlert('danger', detail.code, detail.msg);
            }
          }
        });

        // Set all field errors at once if we can and we have any
        if (form && typeof form.setErrors === 'function' && Object.keys(fieldErrors).length > 0) {
          form.setErrors(fieldErrors);
        }

        return error;
      }

      // If we reached here, we couldn't parse the error with any known schema
      createAlert('danger', 'UNKNOWN_FORMAT', 'Received an unexpected error format');
      return error;
    } catch (parseError) {
      // Fallback for unparseable errors or if any parsing step throws
      console.error('Error parsing API error response:', parseError);
      createAlert('danger', 'PARSE_ERROR', 'Could not parse error response');
      return error;
    }
  };

  /**
   * General error handler (not specific to API response errors)
   */
  const handleError = (err: any) => {
    if (err.name === 'FetchError' && !err.response) {
      createAlert('danger', 'CONNECTION_ERROR', 'Network error. Please check your connection.');
      return;
    }

    // Just display the error message if it's a string
    if (typeof err === 'string') {
      createAlert('danger', 'ERROR', err);
      return;
    }

    // Handle Error objects
    if (err instanceof Error) {
      createAlert('danger', 'ERROR', err.message);
      return;
    }

    // Fallback
    createAlert('danger', 'UNKNOWN_ERROR', 'An unexpected error occurred');
  };

  return {
    handleResponseError,
    handleError,
    alertMessage,
    clearError,
  };
}
