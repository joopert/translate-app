// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      enableSidebar: true,
      baseURL: 'http://localhost:8001/api', //TODO: get this from .env or so
      company: {
        name: 'amfyapp',
        website: 'https://dev.amfyapp.com',
        infoEmail: 'hello@amfyapp.com',
        officialName: 'amfyapp',
      },
    },
  },
  devServer: {
    port: 3001,
  },
  modules: [
    '@vee-validate/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    'nuxt-purgecss', // improves performance by removing unused CSS
    'nuxt-vitalizer', // improves performance for Lighthouse
  ],

  veeValidate: {
    componentNames: {
      Form: 'VeeForm',
      Field: 'VeeField',
      ErrorMessage: 'VeeErrorMessage',
      FieldArray: 'VeeFieldArray',
    },
  },

  vite: {
    plugins: [tailwindcss()], // needed for flowbite
  },
  css: ['~/assets/css/main.css'], // needed for flowbite

  typescript: {
    typeCheck: process.env.NODE_ENV === 'production', // this will take care that during prod build typescript will be checked
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUnusedLocals: true,
        noUnusedParameters: true,
      },
    },
  },

  colorMode: {
    classSuffix: '',
  },

  nitro: {
    compressPublicAssets: {
      brotli: true,
      gzip: true,
    },
  },
});
