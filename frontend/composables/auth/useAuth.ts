import { useJwt } from '@vueuse/integrations/useJwt';
/**
 * Composable for handling authentication state and user profile
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const authCookie = useCookie('is_authenticated', {
    default: () => false,
  });
  const idTokenCookie = useCookie('id_token');
  const profile = ref<any | null>(null);

  /**
   * Updates the profile ref based on the JWT token
   * @param {string | null | undefined} token - The JWT token
   */
  const updateProfileFromToken = (token: string | null | undefined) => {
    // Use the useJwt utility to parse the JWT token
    const { payload } = useJwt(token || '');

    if (!token) {
      profile.value = null;
      return;
    }

    try {
      // Store the payload directly with appropriate type casting
      // This preserves all fields from the Cognito JWT without needing a specific interface
      profile.value = payload.value as any;
    } catch (e) {
      console.error('Failed to parse JWT token:', e);
      profile.value = null;
    }
  };

  // Initialize profile from token if it exists
  updateProfileFromToken(idTokenCookie.value);

  // Watch for token changes
  watch(() => idTokenCookie.value, updateProfileFromToken, { immediate: true });

  /**
   * Computed ref indicating if the user is currently authenticated
   * @type {Ref<boolean>}
   */
  const isAuthenticated = ref(!!authCookie.value);
  watch(
    () => authCookie.value,
    () => {
      isAuthenticated.value = !!authCookie.value;
    },
  );

  /**
   * Checks if the current user has a specific group
   * @param {string} group - The group to check for
   * @returns {boolean} True if the user belongs to the specified group
   */
  const hasGroup = (group: string): boolean => {
    // Check for groups in the Cognito format
    // Use typecasting for the specific access to avoid TypeScript errors
    const cognitoGroups = (profile.value as any)?.[`cognito:groups`];
    return Array.isArray(cognitoGroups) ? cognitoGroups.includes(group) : false;
  };

  return {
    /** Current authentication state */
    isAuthenticated,
    /** Check if user has specific group */
    hasGroup,
  };
};
