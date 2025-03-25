// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      baseURL: "http://localhost:8001/api/v1", //TODO: get this from .env or so
      cookiesAuth: { // TODO: this should be moved to a seperate config, not in public.
        apiBaseUrl: "http://localhost:8001/api/v1",
        refreshTokenUrl: "/auth/refresh",
        redirectOnRefreshTokenExpiration: true,
        redirectTo: "/sign-in"
      }
    }
  },

  modules: [
    '@vee-validate/nuxt',
  ],

  veeValidate: {
    componentNames: {
      Form: "VeeForm",
      Field: "VeeField",
      ErrorMessage: "VeeErrorMessage",
      FieldArray: "VeeFieldArray",
    },
  },

})