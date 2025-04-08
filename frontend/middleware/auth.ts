export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware for auth pages to prevent redirect loops
  if (to.path.startsWith('/auth/')) {
    return;
  }

  // Skip authentication check during SSR - let client handle it
  if (!import.meta.client) {
    return;
  }

  const { isAuthenticated, refreshToken, isRefreshing, currentRefreshPromise } = useAuth();

  // Case 1: Already authenticated - continue to route
  if (isAuthenticated.value) {
    return;
  }

  // Case 2: Authentication in progress - wait for it to complete
  if (isRefreshing.value && currentRefreshPromise.value) {
    await currentRefreshPromise.value;
    if (isAuthenticated.value) {
      return; // Refresh succeeded, continue to route
    }
    return navigateTo({
      path: '/auth/sign-in',
      query: {
        redirect: to.fullPath,
      },
    });
  }

  // Case 3: Not authenticated or refresh failed - try refreshing
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
