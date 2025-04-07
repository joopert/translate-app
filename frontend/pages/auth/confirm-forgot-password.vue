<template>
  <section class="bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <UiAlert
        v-if="alertMessage"
        :category="alertMessage.category"
        :message="alertMessage.message"
        :type="alertMessage.type"
        @close="alertMessage = null"
      />

      <div
        class="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8"
      >
        <h2
          class="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
        >
          Reset Password
        </h2>
        <form class="mt-4 space-y-4 lg:mt-5 md:space-y-5" @submit="onSubmit">
          <VeeField
            name="confirmation_code"
            v-slot="{ field, errorMessage }"
            :validate-on-model-update="false"
          >
            <div>
              <label
                for="confirmationCode"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your confirmation code</label
              >
              <input
                type="text"
                id="confirmationCode"
                v-bind="field"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="123456"
              />
              <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-500">
                {{ errorMessage }}
              </p>
            </div>
          </VeeField>
          <VeeField name="email" v-slot="{ field, errorMessage }" :validate-on-model-update="false">
            <div>
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your email</label
              >
              <input
                type="text"
                id="email"
                autocomplete="username"
                v-bind="field"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
              />
              <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-500">
                {{ errorMessage }}
              </p>
            </div>
          </VeeField>
          <VeeField
            name="new_password"
            v-slot="{ field, errorMessage }"
            :validate-on-model-update="false"
          >
            <div>
              <label
                for="password"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >New password</label
              >
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                v-bind="field"
                autocomplete="new-password"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-500">
                {{ errorMessage }}
              </p>
            </div>
          </VeeField>
          <button
            type="submit"
            class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            <UiLoadingSpinner v-if="loading" />Reset password
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { zConfirmForgotPassword } from '~/api-client/zod.gen';
import { authPostConfirmForgotPassword } from '~/api-client/sdk.gen';
import { useFormErrorHandler } from '~/composables/useFormErrorHandler';
const route = useRoute();
const redirectPath = ref((route.query.redirect as string) || '/');

const form = useForm({
  validationSchema: toTypedSchema(zConfirmForgotPassword),
  initialValues: {
    email: route.query.email as string,
  },
});
const { handleSubmit } = form;

const { alertMessage, handleResponseError, clearError, loading, startLoading, stopLoading } =
  useFormErrorHandler({ form });

onMounted(() => {
  const { getRedirectMessage } = useRedirectMessage();
  const redirectMsg = getRedirectMessage();
  if (redirectMsg) {
    alertMessage.value = redirectMsg;
  }
});
const onSubmit = handleSubmit(async values => {
  clearError();
  startLoading();

  try {
    await authPostConfirmForgotPassword({
      composable: '$fetch',
      body: {
        email: values.email,
        confirmation_code: values.confirmation_code,
        new_password: values.new_password,
      },
      onResponseError: handleResponseError,
    });

    await navigateTo(redirectPath.value);
  } catch (error) {
    console.error('Unhandled signup error:', error);
  } finally {
    stopLoading();
  }
});
</script>
