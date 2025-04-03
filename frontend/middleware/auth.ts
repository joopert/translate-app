import { useAuth } from '~/composables/auth/useAuth';

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  // If user is not authenticated, redirect to sign-in
  if (!isAuthenticated.value) {
    // Preserve the intended destination in the redirect URL
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
