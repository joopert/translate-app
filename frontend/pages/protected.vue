<template>
  <div>Protected test page</div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});
</script>
