import { useFlowbite } from "~/composables/ui/useFlowbite";

export default defineNuxtPlugin({
  name: "load-flowbite",
  parallel: true,
  async setup(nuxtApp) {
    nuxtApp.hook("app:mounted", () => {
      useFlowbite((flowbite) => {
        // it is better to initialize all components seperately, optimizes loading.
        // flowbite.initDropdowns();
        // flowbite.initModals();
        // flowbite.initDismisses();
        flowbite.initFlowbite();
      });
    });
  },
});
