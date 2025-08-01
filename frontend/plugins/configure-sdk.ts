import { client } from "~/api-client/client.gen";

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();

  client.setConfig({
    baseURL: runtimeConfig.public.baseURL,
    credentials: import.meta.dev ? "include" : "same-origin", // backend and frontend are on different ports on localhost. On prod it must be same-origin
  });
});
