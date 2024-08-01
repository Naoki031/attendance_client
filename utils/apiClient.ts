import { useCookie } from '#app'

const baseURL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

export const apiClient = {
  async get<T>(url: string, params?: any) {
    return this.request<T>(url, 'GET', undefined, params)
  },

  async post<T>(url: string, body: any) {
    return this.request<T>(url, 'POST', body)
  },

  async put<T>(url: string, body: any) {
    return this.request<T>(url, 'PUT', body)
  },

  async patch<T>(url: string, body: any) {
    return this.request<T>(url, 'PATCH', body)
  },

  async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    body?: any,
    params?: any,
  ): Promise<T> {
    try {
      const token = useCookie('token')

      const response = await $fetch<T>(url, {
        method: method as 'GET' | 'POST' | 'PUT' | 'PATCH',
        baseURL,
        body,
        params,

        onRequest({ options }) {
          if (token) {
            const headers = (options.headers ||= {})
            if (Array.isArray(headers)) {
              headers.push(['Authorization', `Bearer ${token}`])
            } else if (headers instanceof Headers) {
              headers.set('Authorization', `Bearer ${token}`)
            } else {
              headers.Authorization = `Bearer ${token}`
            }
          }
        },

        onResponse({ response }) {
          if (response.status === 401) {
            // Custom handling for 401
            console.error('Unauthorized: Please log in.')
            // Redirect to login or show a modal
          }
        },

        onResponseError({ response }) {
          if (response.status === 500) {
            // Custom handling for 500
            console.error('Server Error: Please try again later.')
            // Show an error message to the user
          }
          throw response // Rethrow the error to be caught by the caller
        },
      })

      return response
    } catch (error) {
      console.error('Failed to fetch:', error)
      throw error
    }
  },
}
