export const apiClient = {
  get<T>(url: string, parameters?: Record<string, string>): Promise<T> {
    return this.request<T>(url, 'GET', undefined, parameters)
  },

  post<T>(
    url: string,
    body: Record<string, unknown>,
    parameters?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(url, 'POST', body, parameters)
  },

  put<T>(
    url: string,
    body: Record<string, unknown>,
    parameters?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(url, 'PUT', body, parameters)
  },

  patch<T>(
    url: string,
    body: Record<string, unknown>,
    parameters?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(url, 'PATCH', body, parameters)
  },

  delete<T>(url: string, parameters?: Record<string, string>): Promise<T> {
    return this.request<T>(url, 'DELETE', undefined, parameters)
  },

  /**
   * Sends a multipart/form-data POST request.
   * Used for file uploads (face registration, face check-in).
   */
  postForm<T>(url: string, formData: FormData): Promise<T> {
    const { $apiFetch } = useNuxtApp()
    return ($apiFetch as typeof $fetch)<T>(url, {
      method: 'POST',
      body: formData,
    })
  },

  request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>,
    parameters?: Record<string, unknown>,
  ): Promise<T> {
    const { $apiFetch } = useNuxtApp()

    return ($apiFetch as typeof $fetch)<T>(url, {
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH',
      body,
      params: parameters,
    })
  },
}
