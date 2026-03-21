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

    onResponseError({ response }: { response: Response }) {
      if (response.status === 401) {
        const route = useRoute()

        // Do not redirect if already on the login page (avoids redirect loop on bad credentials)
        if (route.path !== '/login') {
          token.value = null
          if (import.meta.client) localStorage.removeItem('token')
          navigateTo('/login')
        }
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
