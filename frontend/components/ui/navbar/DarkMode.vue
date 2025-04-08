<template>
  <div>
    <button
      @click="
        $colorMode.value == 'dark'
          ? ($colorMode.preference = 'light')
          : ($colorMode.preference = 'dark')
      "
      type="button"
      data-dropdown-toggle="notification-dropdown"
      class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-600 flex items-center justify-center"
    >
      <span class="sr-only">Switch dark mode</span>
      <!-- Adjusted icon span with better centering -->
      <span
        data-allow-mismatch="class"
        class="h-6 w-6 flex items-center justify-center"
        :class="$colorMode.value === 'dark' ? 'i-mdi-weather-sunny' : 'i-mdi-weather-night'"
      ></span>
    </button>
  </div>
</template>
