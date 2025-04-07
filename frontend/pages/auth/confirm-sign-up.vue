<template>
  <section class="bg-gray-50 dark:bg-gray-900">
    <div
      class="mx-auto grid h-screen max-w-screen-xl justify-items-center px-4 py-8 lg:grid-cols-12 lg:gap-20 lg:py-16"
    >
      <div class="mr-auto hidden place-self-center lg:col-span-6 lg:flex">
        <img
          class="mx-auto"
          src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/authentication/illustration.svg"
          alt="illustration"
        />
      </div>
      <div class="place-self-center lg:col-span-6">
        <UiAlert
          v-if="alertMessage"
          :category="alertMessage.category"
          :message="alertMessage.message"
          :type="alertMessage.type"
          @close="alertMessage = null"
        />
        <div
          v-if="!hasEmail"
          class="rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:max-w-xl sm:p-6"
        >
          <h1
            class="mb-2 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white"
          >
            Confirm sign up
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            The verification link appears to be incomplete. Please return to your email and click
            the entire link without editing or truncating it.
          </p>
        </div>
        <div v-else class="rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:max-w-xl sm:p-6">
          <h1
            class="mb-2 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white"
          >
            Confirm sign up
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            Please check your email for the verification code we sent to <strong>{{ email }}</strong
            >. Enter the code below to verify your identity.
          </p>
          <form @submit.prevent="onSubmit" class="mt-4">
            <VeeField
              name="confirmation_code"
              v-slot="{ field, errorMessage }"
              :validate-on-model-update="false"
            >
              <div>
                <label
                  for="confirmationCode"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Verification code</label
                >
                <input
                  type="text"
                  id="confirmationCode"
                  v-bind="field"
                  inputmode="numeric"
                  maxlength="6"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="123456"
                />
                <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-500">
                  {{ errorMessage }}
                </p>
              </div>
            </VeeField>
            <div class="flex flex-col mt-4 space-y-2">
              <button
                type="submit"
                class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                :disabled="loading || resendLoading"
              >
                <UiLoadingSpinner v-if="loading" />Verify Account
              </button>
              <button
                type="button"
                @click="resendCode"
                class="text-sm text-primary-600 hover:underline dark:text-primary-500 font-medium"
                :disabled="resendLoading"
              >
                <UiLoadingSpinner v-if="resendLoading" />Didn't receive a code? Send again
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { zConfirmSignUp } from '~/api-client/zod.gen';
import { authPostConfirmSignUp, authPostResendConfirmationCode } from '~/api-client/sdk.gen';
import { useFormErrorHandler } from '~/composables/useFormErrorHandler';

const { createRedirectMessage } = useRedirectMessage();
const route = useRoute();

// Get email from URL query params
const email = ref((route.query.email as string) || '');
const hasEmail = computed(() => !!email.value);
const resendLoading = ref(false);

// Initialize the form only if we have an email
const form = useForm({
  validationSchema: toTypedSchema(zConfirmSignUp),
  initialValues: {
    email: email.value,
  },
});
const { handleSubmit } = form;

const { alertMessage, handleResponseError, clearError, loading, startLoading, stopLoading } =
  useFormErrorHandler({ form });

// Display an error if email is missing
onMounted(() => {
  if (!hasEmail.value) {
    alertMessage.value = {
      type: 'danger',
      category: 'Missing information',
      message: 'Email address is required to verify your account',
    };
  }

  // Get any redirect message
  const { getRedirectMessage } = useRedirectMessage();
  const redirectMsg = getRedirectMessage();
  if (redirectMsg) {
    alertMessage.value = redirectMsg;
  }
});

const onSubmit = handleSubmit(async values => {
  // Double check we have an email
  if (!values.email) {
    alertMessage.value = {
      type: 'danger',
      category: 'Missing information',
      message: 'Email address is required to verify your account',
    };
    return;
  }

  clearError();
  startLoading();

  let result;
  try {
    result = await authPostConfirmSignUp({
      composable: '$fetch',
      body: {
        email: values.email,
        confirmation_code: values.confirmation_code,
      },
      onResponseError: handleResponseError,
    });

    if (result) {
      await navigateTo({
        path: '/auth/sign-in',
        query: {
          ...createRedirectMessage({
            type: 'success',
            message: 'Your account was created successfully. Please sign in.',
            category: 'Account created',
          }),
        },
      });
    }
  } catch (error) {
    console.error('Unhandled signup error:', error);
    // if (!alertMessage.value) {
    //   alertMessage.value = {
    //     type: 'danger',
    //     category: 'Verification failed',
    //     message: 'There was a problem verifying your account. Please try again or contact support.',
    //   };
    // }
  } finally {
    stopLoading();
  }
});

// Function to resend verification code
async function resendCode() {
  if (!email.value) {
    alertMessage.value = {
      type: 'danger',
      category: 'Missing information',
      message: 'Email address is required to resend the verification code',
    };
    return;
  }

  resendLoading.value = true;
  clearError();

  try {
    await authPostResendConfirmationCode({
      composable: '$fetch',
      body: {
        email: email.value,
      },
      onResponseError: handleResponseError,
    });

    alertMessage.value = {
      type: 'success',
      category: 'Code sent',
      message: 'A new verification code has been sent to your email',
    };
  } catch (error) {
    console.error('Error resending code:', error);
    // Ensure the user sees an error message even if not handled by handleResponseError
    if (!alertMessage.value) {
      alertMessage.value = {
        type: 'danger',
        category: 'Failed to resend',
        message: 'There was a problem sending a new verification code. Please try again later.',
      };
    }
  } finally {
    resendLoading.value = false;
  }
}
</script>
