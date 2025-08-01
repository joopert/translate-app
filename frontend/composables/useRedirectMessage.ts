import { useRoute, useRouter } from "vue-router";

// Alert message interface - match this with your existing AlertMessage type
interface AlertMessage {
  type: "success" | "info" | "warning" | "danger";
  category: string | undefined;
  message: string;
}

interface RedirectAlertMessage {
  redirect_type: "success" | "info" | "warning" | "danger";
  redirect_category: string | undefined;
  redirect_message: string;
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
        type: type as AlertMessage["type"],
        category: category || undefined,
        message: message,
      };

      const { redirect_type, redirect_message, redirect_category, ...query } =
        route.query;
      router.replace({ query });

      return result;
    }

    return null;
  }

  /**
   * Create a router location object with redirect message parameters
   *
   * @param redirect_message - The message text to display in the alert
   * @param redirect_type - The type of alert to show: 'success', 'info', 'warning', or 'danger'
   * @param redirect_category - The category identifier for the alert (e.g., 'ACCOUNT_CREATED')
   * @returns A object with query parameters for the alert
   */
  function createRedirectMessage(message: AlertMessage): RedirectAlertMessage {
    return {
      redirect_type: message.type,
      redirect_message: message.message,
      redirect_category: message.category,
    };
  }

  return {
    getRedirectMessage,
    createRedirectMessage,
  };
}
