import { defineNuxtPlugin, useRuntimeConfig } from '#app'

export interface ApiClient {
  get<T>(url: string, params?: any): Promise<T>
  post<T>(url: string, body: any): Promise<T>
  put<T>(url: string, body: any): Promise<T>
  patch<T>(url: string, body: any): Promise<T>
}

export default defineNuxtPlugin((nuxtApp) => {
  // const { session } = useUserSession()
  const config = useRuntimeConfig()

  const fetch: ApiClient = {
    async get<T>(url: string, params?: any): Promise<T> {
      return $fetch(url, {
        method: 'GET',
        baseURL: String(config.public.apiBaseUrl),
        params,
      })
    },
    async post<T>(url: string, body: any): Promise<T> {
      return $fetch(url, {
        method: 'POST',
        baseURL: String(config.public.apiBaseUrl),
        body,
      })
    },
    async put<T>(url: string, body: any): Promise<T> {
      return $fetch(url, {
        method: 'PUT',
        baseURL: String(config.public.apiBaseUrl),
        body,
      })
    },
    async patch<T>(url: string, body: any): Promise<T> {
      return $fetch(url, {
        method: 'PATCH',
        baseURL: String(config.public.apiBaseUrl),
        body,
      })
    },
  }

  nuxtApp.provide('fetch', fetch)
})
