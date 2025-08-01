<template>
  <!-- class="flex items-center p-4 mb-4 text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 -->
  <div
    v-show="visible"
    class="flex items-center p-4 mb-4 text-sm rounded-lg dark:bg-gray-800 border"
    :class="typeClasses[type]"
    role="alert"
  >
    <slot name="icon">
      <div
        class="shrink-0 inline w-4 h-4 me-3"
        :class="`${props.icon}`"
        aria-hidden="true"
      ></div>
    </slot>
    <span class="sr-only">
      <slot name="category">{{ props.category }}</slot>
    </span>
    <div>
      <span v-if="props.category" class="font-medium">
        <slot name="category"
          >{{ props.category }}{{ props.message ? ": " : "" }}</slot
        >
      </span>
      <slot v-if="props.message">{{ props.message }}</slot>
    </div>
    <button
      v-if="closable"
      type="button"
      class="ms-auto -mx-1.5 -my-1.5 bg-blue-50 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:hover:bg-gray-700"
      :class="closeButtonClasses[type]"
      aria-label="Close"
      @click="onCloseClick"
    >
      <span class="sr-only">Close</span>
      <svg
        class="w-3 h-3"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 14"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
export interface IAlertProps {
  type: "info" | "danger" | "success" | "warning" | "dark";
  category?: string;
  message?: string;
  icon?: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<IAlertProps>(), {
  type: "info",
  category: "Info",
  icon: "i-mdi-information",
  closable: true,
});

const emit = defineEmits<{ (e: "close"): void }>();

const visible = ref(true);

const typeClasses = {
  info: "text-blue-800 bg-blue-50 dark:text-blue-400 border-blue-300 dark:border-blue-800",
  danger:
    "text-red-800 bg-red-50 dark:text-red-400 border-red-300 dark:border-red-800",
  success:
    "text-green-800 bg-green-50 dark:text-green-400 border-green-300 dark:border-green-800",
  warning:
    "text-yellow-800 bg-yellow-50 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800",
  dark: "text-gray-800 bg-gray-50 dark:text-gray-300 border-gray-300 dark:border-gray-800",
};

const closeButtonClasses = {
  info: "text-blue-500 dark:text-blue-400 bg-blue-50 hover:bg-blue-200 focus:ring-blue-400",
  danger:
    "text-red-500 dark:text-red-400 bg-red-50 hover:bg-red-200 focus:ring-red-400",
  success:
    "text-green-500 dark:text-green-400 bg-green-50 hover:bg-green-200 focus:ring-green-400",
  warning:
    "text-yellow-500 dark:text-yellow-300 bg-yellow-50 hover:bg-yellow-200 focus:ring-yellow-400",
  dark: "text-gray-500 dark:text-gray-300 bg-gray-50 hover:bg-gray-200 focus:ring-gray-400 dark:hover:text-white",
};

function onCloseClick() {
  emit("close");
  visible.value = false;
}
</script>
