export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter();

  router.beforeEach((to, from, next) => {
    const redirectUrl = to.query.redirect;

    if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('/')) {
      const { redirect, ...query } = to.query;
      next({ path: redirectUrl, query });
    } else {
      next();
    }
  });
});
