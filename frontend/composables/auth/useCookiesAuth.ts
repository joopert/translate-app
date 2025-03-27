/**
 * This composable is adapted from [nuxt-cookies-auth](https://github.com/nuxt-cookies-auth/nuxt-cookies-auth) by JiProchazka
 * Original: https://github.com/JiProchazka/nuxt-cookies-auth/tree/a14c9a33405a341ed147e16a1b03a681e4c5a812
 */
import { sendRedirect, H3Event } from 'h3';
import type { FetchContext } from 'ofetch';
import { useRequestEvent, useRequestHeaders, useRuntimeConfig } from '#imports';
import type { RuntimeConfig } from '@nuxt/schema';
//docs: when a page loads, and we get a 401, we need to refresh. But the server does not have access to a token at all, so we get 401 on SSR.
// on subsequent requests, we get a 401, and we need to refresh. But the server has access to a token, so SSR works.
const credential = 'include' as const;

export const useCookiesAuth = () => {
  const event = useRequestEvent();
  const header = useRequestHeaders(['cookie']);
  const config = useRuntimeConfig();
  const refreshTokenOnResponseErrorHandler = getRefreshTokenOnResponseErrorHandler(event, config);

  return {
    retryStatusCodes: [401],
    retry: 1,
    baseURL: config.public.cookiesAuth.apiBaseUrl,
    credentials: credential,
    headers: import.meta.server ? { cookie: header.cookie || '' } : undefined,
    onResponseError: async (context: FetchContext) => {
      if (context.response?.status === 401) {
        await $fetch(config.public.cookiesAuth.refreshTokenUrl, {
          method: 'POST',
          baseURL: config.public.cookiesAuth.apiBaseUrl,
          headers: import.meta.server ? { cookie: header.cookie || '' } : undefined,
          credentials: credential,
          onResponseError: refreshTokenOnResponseErrorHandler,
        });
      }
    },
  };
};

function getRefreshTokenOnResponseErrorHandler(event: H3Event | undefined, config: RuntimeConfig) {
  if (config.public.cookiesAuth.redirectOnRefreshTokenExpiration) {
    const handler = async (refreshContext: FetchContext) => {
      if (refreshContext.response?.status === 401) {
        if (import.meta.client) {
          window.location.href = config.public.cookiesAuth.redirectTo;
          return;
        }

        if (import.meta.server && event) {
          try {
            if (!event.node.res.headersSent && !event.node.res.writableEnded) {
              return await sendRedirect(event, config.public.cookiesAuth.redirectTo);
            }
          } catch (error) {
            console.error('Failed to redirect:', error);
          }
        }
      }
    };
    return handler;
  } else {
    return undefined;
  }
}
