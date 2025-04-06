<template></template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useRedirectMessage } from '~/composables/useRedirectMessage';
import { onMounted } from 'vue';

const route = useRoute();
const { createRedirectUrl } = useRedirectMessage();

onMounted(() => {
  const redirect = route.query.redirect as string;
  const error = route.query.error as string;
  const errorDescription = route.query.error_description as string;

  if (error) {
    navigateTo(
      createRedirectUrl(
        '/auth/sign-in',
        'danger',
        errorDescription || 'Authentication failed. Please try again.',
        'AUTHENTICATION_FAILED',
      ),
    );
    return;
  }

  if (redirect) {
    navigateTo(redirect);
  } else {
    navigateTo('/');
  }
});
</script>
