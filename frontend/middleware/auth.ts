export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware for auth pages to prevent redirect loops
  if (to.path.startsWith('/auth/')) {
    return;
  }

  // Skip authentication check during SSR - let client handle it
  if (!import.meta.client) {
    return;
  }

  const { isAuthenticated, refreshToken, waitForRefresh } = useAuth();

  // Case 1: Already authenticated - continue to route
  if (isAuthenticated.value) {
    return;
  }

  // Case 2: Authentication in progress - wait for it to complete
  await waitForRefresh();

  // After waiting for any in-progress refresh, check auth state again
  if (isAuthenticated.value) {
    return; // Refresh succeeded, continue to route
  }

  // Case 3: Not authenticated yet - try refreshing
  if (!isAuthenticated.value) {
    await refreshToken();

    // If refresh succeeded, continue to route
    if (isAuthenticated.value) {
      return;
    }
  }

  // Case 4: Still not authenticated after all attempts - redirect to sign-in
  return navigateTo({
    path: '/auth/sign-in',
    query: {
      redirect: to.fullPath,
    },
  });
});
