import { useRequestHeaders } from '#app';
import { getCurrentUserAuthMe2Get } from '~/api-client/sdk.gen';

/**
 * Composable for handling authentication state and user profile
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const isAuthenticated = useState('isAuthenticated', () => false);

  const checkAuth = async () => {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : {};

    try {
      await getCurrentUserAuthMe2Get({
        baseURL: 'http://localhost:8001/api',
        composable: '$fetch',
        credentials: 'include',
        headers,
      });
      isAuthenticated.value = true;
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      isAuthenticated.value = false;
      return false;
    }
  };

  return {
    isAuthenticated,
    checkAuth,
  };
};
