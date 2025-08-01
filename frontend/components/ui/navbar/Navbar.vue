<template>
  <header class="antialiased">
    <nav
      class="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800 border-b dark:border-gray-700 fixed left-0 right-0 top-0 z-50"
    >
      <div class="flex flex-wrap justify-between items-center">
        <div class="flex justify-start items-center">
          <!-- Sidebar toggle button only shown on small screens -->
          <button
            v-if="$config.public.enableSidebar"
            data-drawer-target="sidebar-navigation"
            data-drawer-toggle="sidebar-navigation"
            aria-expanded="true"
            aria-controls="sidebar-navigation"
            class="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer md:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg
              class="w-[18px] h-[18px]"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
            <span class="sr-only">Toggle sidebar</span>
          </button>
          <NuxtLink to="/" class="flex mr-4">
            <img
              src="https://flowbite.s3.amazonaws.com/logo.svg"
              class="mr-3 h-8"
              :alt="$config.public.company.name + ' Logo'"
            />
            <span
              class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white"
              >{{ $config.public.company.name }}</span
            >
          </NuxtLink>
          <form action="#" method="GET" class="hidden lg:block lg:pl-2">
            <label for="topbar-search" class="sr-only">Search</label>
            <div class="relative mt-1 lg:w-96">
              <div
                class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"
              >
                <svg
                  class="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                id="topbar-search"
                type="text"
                name="email"
                class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-9 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Search"
              />
            </div>
          </form>
        </div>
        <div class="flex items-center lg:order-2">
          <button
            v-if="$config.public.enableSidebar"
            id="toggleSidebarMobileSearch"
            type="button"
            class="p-2 text-gray-500 rounded-lg lg:hidden hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span class="sr-only">Search</span>
            <!-- Search icon -->
            <svg
              class="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </button>
          <UiNavbarDarkMode />
          <UiNavbarNotifications />
          <UiNavbarUserMenu />
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
onMounted(() => {
  useFlowbite((flowbite) => {
    flowbite.initDrawers();
    flowbite.initDropdowns();
  });
});
</script>
