import { useRoute, useRouter } from 'vue-router';

// Alert message interface - match this with your existing AlertMessage type
interface AlertMessage {
  type: 'success' | 'info' | 'warning' | 'danger';
  category: string | undefined;
  message: string;
}

/**
 * Composable to handle redirect messages in URL parameters
 * Works with the existing UiAlert component
 */
export function useRedirectMessage() {
  const route = useRoute();
  const router = useRouter();

  /**
   * Check for redirect message in URL query parameters and return it if found
   * Also cleans up the URL by removing the message parameters after processing
   *
   * @returns An AlertMessage object if message parameters are found, null otherwise
   */
  function getRedirectMessage(): AlertMessage | null {
    const type = route.query.redirect_type as string;
    const message = route.query.redirect_message as string;
    const category = route.query.redirect_category as string | undefined;

    if (type && message) {
      const result: AlertMessage = {
        type: type as AlertMessage['type'],
        category: category || undefined,
        message: message,
      };

      const { redirect_type, redirect_message, redirect_category, ...query } = route.query;
      router.replace({ query });

      return result;
    }

    return null;
  }

  /**
   * Create a router location object with redirect message parameters
   *
   * @param path - The target path to navigate to (e.g., '/auth/sign-in')
   * @param type - The type of alert to show: 'success', 'info', 'warning', or 'danger'
   * @param message - The message text to display in the alert
   * @param category - The category identifier for the alert (e.g., 'ACCOUNT_CREATED')
   * @returns A router location object with query parameters for the alert
   */
  function createRedirectUrl(path: string, type: string, message: string, category: string) {
    return {
      path,
      query: {
        redirect_type: type,
        redirect_message: message,
        redirect_category: category,
      },
    };
  }

  return {
    getRedirectMessage,
    createRedirectUrl,
  };
}
