import { useCookie, navigateTo } from '#app'

const baseURL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

export const apiClient = {
  get<T>(url: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(url, 'GET', undefined, params)
  },

  post<T>(
    url: string,
    body: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(url, 'POST', body, params)
  },

  put<T>(url: string, body: Record<string, unknown>, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, 'PUT', body, params)
  },

  patch<T>(
    url: string,
    body: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(url, 'PATCH', body, params)
  },

  delete<T>(url: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(url, 'DELETE', undefined, params)
  },

  async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<T> {
    try {
      let token = useCookie('token')
      const response = await $fetch<T>(url, {
        method: method as 'GET' | 'POST' | 'PUT' | 'PATCH',
        baseURL,
        body,
        params,

        onRequest({ options }) {
          if (token.value) {
            let headers: HeadersInit = options.headers || {}

            if (headers instanceof Headers) {
              headers.set('Authorization', `Bearer ${token.value}`)
            } else if (typeof headers === 'object') {
              headers = headers as Record<string, string>
              headers.Authorization = `Bearer ${token.value}`
            }

            options.headers = new Headers(headers)
          }
        },

        onResponse({ response }) {
          if (response.status === 401) {
            token.value = null
            navigateTo('/login')
          }
        },

        onResponseError({ response }) {
          if (response.status === 500) {
            console.error('Server Error: Please try again later.')
          }

          throw response
        },
      })

      return response
    } catch (error) {
      console.error('Failed to fetch:', error)

      throw error
    }
  },
}
