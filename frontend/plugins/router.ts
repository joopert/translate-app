export default defineNuxtPlugin(() => {
  const router = useRouter();

  router.beforeEach((to, _from, next) => {
    const redirectUrl = to.query.redirect;

    if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('/')) {
      const { redirect, ...query } = to.query;
      next({ path: redirectUrl, query });
    } else {
      next();
    }
  });
});
