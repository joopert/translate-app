import { useAuth } from '~/composables/auth/useAuth';

export default defineNuxtRouteMiddleware(to => {
  // Skip middleware for auth pages to prevent redirect loops
  if (to.path.startsWith('/auth/')) {
    return;
  }

  const { isAuthenticated } = useAuth();
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/auth/sign-in',
      query: {
        redirect: to.fullPath,
      },
    });
  }
});
