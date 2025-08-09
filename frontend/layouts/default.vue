<template>
  <div
    class="min-w-screen min-h-screen bg-white dark:bg-gray-900 flex flex-col"
  >
    <UiNavbar></UiNavbar>
    <main class="flex-grow mt-16">
      <div class="p-4 rounded-lg">
        <slot></slot>
      </div>
    </main>
  </div>
</template>
