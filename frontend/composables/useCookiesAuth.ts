/**
 * This composable is adapted from [nuxt-cookies-auth](https://github.com/nuxt-cookies-auth/nuxt-cookies-auth) by JiProchazka
 * Original: https://github.com/JiProchazka/nuxt-cookies-auth/tree/a14c9a33405a341ed147e16a1b03a681e4c5a812
 */
import { sendRedirect, H3Event } from "h3"
import type { FetchContext } from "ofetch"
import { navigateTo, useRequestEvent, useRequestHeaders, useRuntimeConfig, useRoute } from "#imports"
import type { RuntimeConfig } from "@nuxt/schema"

const credential = "include" as const

export const useCookiesAuth = (fromPath: string | undefined = undefined) => {
  const event = useRequestEvent()
  const header = useRequestHeaders()
  const config = useRuntimeConfig()
  const fromPathValue = fromPath || useRoute().path
  const refreshTokenOnResponseErrorHandler = getRefreshTokenOnResponseErrorHandler(event, config, fromPathValue)
  return {
    retryStatusCodes: [401],
    retry: 1,
    baseURL: config.public.cookiesAuth.apiBaseUrl,
    credentials: credential,
    onResponseError: async (context: FetchContext) => {
      if (context.response?.status === 401) {
        await $fetch(config.public.cookiesAuth.refreshTokenUrl, {
          method: "POST",
          baseURL: config.public.cookiesAuth.apiBaseUrl,
          headers: import.meta.server ? { cookie: header.cookie } : undefined,
          credentials: credential,
          onResponseError: refreshTokenOnResponseErrorHandler
        })
      }
    }
  }
}

function getRefreshTokenOnResponseErrorHandler(event: H3Event | undefined, config: RuntimeConfig, fromPath: string) {
  if (config.public.cookiesAuth.redirectOnRefreshTokenExpiration) {
    const handler = async (refreshContext: FetchContext) => {
      if (refreshContext.response?.status === 401) {
        if (isExternalApi(config)) {
          await navigateTo(config.public.cookiesAuth.redirectTo)
        } else {
          if (refreshContext.response?.status === 401) {
            if (import.meta.server) {
              if (fromPath !== config.public.cookiesAuth.redirectTo && event) {
                return await sendRedirect(event, config.public.cookiesAuth.redirectTo)
              }
            } else if (import.meta.client) {
              await navigateTo(config.public.cookiesAuth.redirectTo)
            }
          }
        }
      }
    }
    return handler
  } else {
    return undefined
  }
}

function isExternalApi(config: RuntimeConfig) {
  return config.public.cookiesAuth.apiBaseUrl.startsWith("http")
}