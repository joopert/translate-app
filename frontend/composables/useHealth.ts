import { healthGetHealth } from "~/api-client/sdk.gen";

export const useHealthCheck = () => {
  const isHealthy = ref(true);

  const checkHealth = async () => {
    try {
      const health = await healthGetHealth({
        composable: "$fetch",
      });
      isHealthy.value = health.status === "OK";
    } catch (error) {
      console.error("Health check failed:", error);
      isHealthy.value = false;
    }
  };

  return {
    isHealthy,
    checkHealth,
  };
};
