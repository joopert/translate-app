export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for auth pages to prevent redirect loops
  if (to.path.startsWith("/auth/")) {
    return;
  }

  // Skip authentication check during SSR - let client handle it
  if (!import.meta.client) {
    return;
  }

  const { isAuthenticated } = useAuth();

  if (isAuthenticated.value) {
    return;
  }

  return navigateTo({
    path: "/auth/sign-in",
    query: {
      redirect: to.fullPath,
    },
  });
});
