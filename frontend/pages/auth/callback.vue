<template></template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const { createRedirectMessage } = useRedirectMessage();

onMounted(() => {
  const redirect = route.query.redirect as string;
  const error = route.query.error as string;
  const errorDescription = route.query.error_description as string;

  if (error) {
    navigateTo({
      path: '/auth/sign-in',
      query: {
        ...createRedirectMessage({
          type: 'danger',
          message: errorDescription || 'Please try again.',
          category: 'Authentication failed',
        }),
      },
    });
    return;
  }

  if (redirect) {
    navigateTo(redirect);
  } else {
    navigateTo('/');
  }
});
</script>
