// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'vue/html-self-closing': 'off', // conflicts with prettier. https://github.com/prettier/eslint-config-prettier/issues/85
  },
});
