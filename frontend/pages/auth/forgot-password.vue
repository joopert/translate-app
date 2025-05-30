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
        <h1
          class="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
        >
          Forgot your password?
        </h1>
        <p class="font-light text-gray-500 dark:text-gray-400">
          Enter your email and we'll send you a reset code.
        </p>
        <form class="mt-4 space-y-4 lg:mt-5 md:space-y-5" @submit.prevent="onSubmit">
          <VeeField name="email" v-slot="{ field, errorMessage }" :validate-on-model-update="false">
            <div>
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your email</label
              >
              <input
                id="email"
                v-bind="field"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
                :required="true"
              />
              <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-500">
                {{ errorMessage }}
              </p>
            </div>
          </VeeField>
          <!-- <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input id="terms" aria-describedby="terms" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required="">
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="terms" class="font-light text-gray-500 dark:text-gray-300">I accept the <a class="font-medium text-primary-600 hover:underline dark:text-primary-500" href="#">Terms and Conditions</a></label>
                  </div>
              </div> -->
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
import { zForgotPassword } from '~/api-client/zod.gen';
import { authPostForgotPassword } from '~/api-client/sdk.gen';
import { useFormErrorHandler } from '~/composables/useFormErrorHandler';
const { createRedirectMessage } = useRedirectMessage();

const form = useForm({
  validationSchema: toTypedSchema(zForgotPassword),
});
const { handleSubmit } = form;
const { alertMessage, handleResponseError, clearError, loading, startLoading, stopLoading } =
  useFormErrorHandler({ form });

const onSubmit = handleSubmit(async values => {
  clearError();
  startLoading();

  try {
    await authPostForgotPassword({
      composable: '$fetch',
      body: {
        email: values.email,
      },
      onResponseError: handleResponseError,
    });

    await navigateTo({
      path: '/auth/confirm-forgot-password',
      query: {
        email: values.email,
        ...createRedirectMessage({
          type: 'success',
          message:
            "If we recognize your email address, you'll receive password reset instructions shortly.",
          category: 'Password reset requested',
        }),
      },
    });
  } catch (error) {
    console.error('Unhandled forgot password error:', error);
  } finally {
    stopLoading();
  }
});
</script>
