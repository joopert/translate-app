export default defineNuxtPlugin(async () => {
  // Skip health check on 500 page
  const route = useRoute();
  if (route.path === "/error/500") {
    return;
  }

  if (import.meta.client) {
    return;
  }

  const { checkHealth, isHealthy } = useHealthCheck();
  await checkHealth();

  if (!isHealthy.value) {
    await navigateTo({
      path: "/error/500",
      query: {
        redirect: route.fullPath,
      },
    });
  }
});
