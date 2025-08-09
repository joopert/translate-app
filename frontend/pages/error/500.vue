<template>
  <section class="bg-white dark:bg-gray-900">
    <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
      <div class="mx-auto max-w-screen-sm text-center">
        <h1
          class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500"
        >
          500
        </h1>
        <p
          class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white"
        >
          Internal Server Error.
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          {{ currentMessage }}
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          We are already working to solve the problem.
          <span v-if="!isHealthy" class="block mt-2 text-sm">
            Next retry in {{ countdown }} seconds (Attempt
            {{ currentAttempt }}).
          </span>
        </p>
        <button
          @click="manualRetry"
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
const redirectPath = ref((route.query.redirect as string) || "/");

const messages = ref<string[]>([]);
const currentMessage = ref("");

const autoRetryTimeout = ref<number | null>(null);
const countdownInterval = ref<number | null>(null);
const countdown = ref(0);
const currentAttempt = ref(0);

const initialDelaySeconds = 5;
const maxDelaySeconds = 60;
let currentDelaySeconds = initialDelaySeconds;

const stopCountdown = () => {
  if (countdownInterval.value) {
    window.clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
  countdown.value = 0;
};

const startCountdown = (seconds: number) => {
  stopCountdown();
  countdown.value = seconds;
  countdownInterval.value = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      stopCountdown();
    }
  }, 1000);
};

const stopAutoRetry = () => {
  if (autoRetryTimeout.value) {
    window.clearTimeout(autoRetryTimeout.value);
    autoRetryTimeout.value = null;
  }
  stopCountdown();
};

const scheduleNextRetry = (delaySeconds: number) => {
  stopAutoRetry();
  currentAttempt.value += 1;
  startCountdown(delaySeconds);

  autoRetryTimeout.value = window.setTimeout(async () => {
    await performRetry();
  }, delaySeconds * 1000);
};

const performRetry = async () => {
  await checkHealth();

  if (isHealthy.value) {
    stopAutoRetry();
    navigateTo(redirectPath.value);
  } else {
    currentDelaySeconds = Math.min(currentDelaySeconds * 2, maxDelaySeconds);
    scheduleNextRetry(currentDelaySeconds);
  }
};

const startAutoRetry = () => {
  stopAutoRetry();
  currentAttempt.value = 0;
  currentDelaySeconds = initialDelaySeconds;
  currentMessage.value = getRandomMessage();
  scheduleNextRetry(currentDelaySeconds);
};

const manualRetry = async () => {
  stopAutoRetry();
  currentAttempt.value = 0;
  currentDelaySeconds = initialDelaySeconds;
  currentMessage.value = getRandomMessage();
  await performRetry();
};

const getRandomMessage = () => {
  if (!messages.value || messages.value.length === 0)
    return "We seem to be experiencing technical difficulties. Please wait.";
  return messages.value[Math.floor(Math.random() * messages.value.length)];
};

onMounted(async () => {
  try {
    const response = await fetch("/data/500-messages.json");
    if (!response.ok) throw new Error("Failed to fetch messages");
    const data = await response.json();
    messages.value = data.messages;
  } catch (error) {
    console.error("Error loading 500 messages:", error);
    messages.value = [
      "An unexpected error occurred. We are trying to reconnect.",
    ];
  }
  startAutoRetry();
});

onUnmounted(() => {
  console.log("500 page unmounted. Clearing timers.");
  stopAutoRetry();
});
</script>
