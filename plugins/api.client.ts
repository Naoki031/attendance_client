import type { FetchOptions } from 'ofetch'

function getToken(): string | null {
  if (!import.meta.client) return null

  return localStorage.getItem('token')
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token')

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    onRequest({ options }: { options: FetchOptions }) {
      const tokenValue = getToken()

      if (tokenValue) {
        options.headers = {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${tokenValue}`,
        }
      }
    },

    onResponseError({ request, response }: { request: Request | string; response: Response }) {
      if (response.status === 401) {
        const route = useRoute()

        // Do not redirect if already on the login page (avoids redirect loop on bad credentials)
        if (route.path !== '/login') {
          token.value = null

          if (import.meta.client) {
            localStorage.removeItem('token')
            localStorage.removeItem('role_level')

            // Clear user store state without calling API logout (token is already invalid)
            const userStore = useUserStore()
            userStore.isAuthenticated = false
            userStore.user = null
            userStore.roleLevel = 'user'

            const roleLevelCookie = useCookie<string | null>('role_level')
            roleLevelCookie.value = null

            navigateTo('/login')
          }
        }
      }

      if (response.status === 403) {
        // Log clearly so developers know a permission is missing — check server logs for details
        console.warn(
          `[403 Forbidden] ${String(request)} — user lacks required permission. ` +
            `Check server logs: [PermissionsGuard] WARN for the exact missing permission.`,
        )
      }

      if (response.status === 500) {
        console.error('Server Error: Please try again later.')
      }
    },
  } as FetchOptions)

  return {
    provide: { apiFetch },
  }
})
