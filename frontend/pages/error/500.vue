<template>
  <section class="bg-white dark:bg-gray-900">
    <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
      <div class="mx-auto max-w-screen-sm text-center">
        <h1
          class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500"
        >
          500
        </h1>
        <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
          Internal Server Error.
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          {{ currentMessage }}
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          We are already working to solve the problem.
        </p>
        <button
          @click="retryConnection"
          type="button"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          <svg
            class="w-6 h-6 text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"
            />
          </svg>
          Retry Connection
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { checkHealth, isHealthy } = useHealthCheck();
const route = useRoute();
const redirectPath = ref((route.query.redirect as string) || '/');

const messages = ref<string[]>([]);

onMounted(async () => {
  const response = await fetch('/data/500-messages.json');
  const data = await response.json();
  messages.value = data.messages;
  currentMessage.value = getRandomMessage();
});

const getRandomMessage = () => {
  if (!messages.value.length) return 'Loading...';
  return messages.value[Math.floor(Math.random() * messages.value.length)];
};

const currentMessage = ref(getRandomMessage());

const retryConnection = async () => {
  currentMessage.value = getRandomMessage();
  await checkHealth();
  if (isHealthy.value) {
    navigateTo(redirectPath.value);
  }
};
</script>
