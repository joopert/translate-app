import { useJwt } from '@vueuse/integrations/useJwt';
import { authPostRefresh } from '~/api-client/sdk.gen';

/**
 * Composable for handling authentication state and user profile
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  // Store active refresh promise to avoid duplicate refreshes
  const currentRefreshPromise = useState<Promise<boolean> | null>(
    'auth-refresh-promise',
    () => null,
  );

  // Core authentication state
  const authCookie = useCookie('is_authenticated', { default: () => false });
  const idTokenCookie = useCookie('id_token');
  const isAuthenticated = ref(!!authCookie.value);
  const isRefreshing = useState('auth-is-refreshing', () => false);

  // Security and throttling settings
  const refreshAttempts = useState('auth-refresh-attempts', () => 0);
  const lastRefreshTime = useState('auth-last-refresh-time', () => 0);
  const REFRESH_COOLDOWN = 1000; // 1 second between refresh attempts
  const MAX_REFRESH_ATTEMPTS = 3;

  // User profile state
  const profile = ref<any | null>(null);

  /**
   * Updates the profile ref based on the JWT token
   * @param {string | null | undefined} token - The JWT token
   */
  const updateProfileFromToken = (token: string | null | undefined) => {
    if (!token) {
      profile.value = null;
      return;
    }

    try {
      const { payload } = useJwt(token || '');
      profile.value = payload.value as any;
    } catch (e) {
      console.error('Failed to parse JWT token:', e);
      profile.value = null;
    }
  };

  // Initialize profile and watch for token changes
  updateProfileFromToken(idTokenCookie.value);
  watch(() => idTokenCookie.value, updateProfileFromToken, { immediate: true });

  /**
   * Attempts to refresh the authentication token
   * @returns {Promise<boolean>} True if refresh was successful
   */
  const refreshToken = async (): Promise<boolean> => {
    // Check for throttling/cooldown
    const now = Date.now();
    if (now - lastRefreshTime.value < REFRESH_COOLDOWN) {
      return false;
    }

    // Return existing promise if refresh already in progress
    if (isRefreshing.value && currentRefreshPromise.value) {
      return currentRefreshPromise.value;
    }

    // Fix inconsistent state if needed
    if (isRefreshing.value && !currentRefreshPromise.value) {
      isRefreshing.value = false;
    }

    // Check max attempts
    if (refreshAttempts.value >= MAX_REFRESH_ATTEMPTS) {
      refreshAttempts.value = 0;
      return false;
    }

    // Create and store refresh promise
    isRefreshing.value = true;
    const refreshPromise = (async () => {
      try {
        refreshAttempts.value++;
        lastRefreshTime.value = now;

        // Call the refresh token endpoint
        await authPostRefresh({
          composable: '$fetch',
          credentials: 'include',
        });

        // Update authentication state on success
        isAuthenticated.value = true;
        authCookie.value = true;
        refreshAttempts.value = 0;
        return true;
      } catch (error) {
        // Handle failure
        isAuthenticated.value = false;
        authCookie.value = false;
        return false;
      }
    })();

    // Store the promise and clean up when done
    currentRefreshPromise.value = refreshPromise;
    refreshPromise.finally(() => {
      isRefreshing.value = false;
      if (currentRefreshPromise.value === refreshPromise) {
        currentRefreshPromise.value = null;
      }
    });

    return refreshPromise;
  };

  // Watch auth cookie changes
  watch(
    () => authCookie.value,
    async (newValue, oldValue) => {
      // Update the authenticated state
      isAuthenticated.value = !!newValue;

      // Try to refresh if auth was lost and on client side
      if (oldValue && !newValue && import.meta.client && !isRefreshing.value) {
        await refreshToken();
      }
    },
    { immediate: true },
  );

  /**
   * Checks if the current user has a specific group
   * @param {string} group - The group to check for
   * @returns {boolean} True if the user belongs to the specified group
   */
  const hasGroup = (group: string): boolean => {
    const cognitoGroups = (profile.value as any)?.[`cognito:groups`];
    return Array.isArray(cognitoGroups) ? cognitoGroups.includes(group) : false;
  };

  return {
    /** Current authentication state */
    isAuthenticated,
    /** Check if user has specific group */
    hasGroup,
    /** Manually trigger a token refresh */
    refreshToken,
    /** Current refresh state */
    isRefreshing,
    /** Current refresh promise */
    currentRefreshPromise,
  };
};
