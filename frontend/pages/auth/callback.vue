<template></template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useRedirectMessage } from '~/composables/useRedirectMessage';
import { onMounted } from 'vue';

const router = useRouter();
const route = useRoute();
const { createRedirectUrl } = useRedirectMessage();

onMounted(() => {
  const redirect = route.query.redirect as string;
  const error = route.query.error as string;
  const errorDescription = route.query.error_description as string;

  if (error) {
    router.push(
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
    router.push(redirect);
  } else {
    router.push('/');
  }
});
</script>
