import type { NitroFetchRequest, $Fetch } from 'nitropack'

export const repository = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
  async get(): Promise<T> {
    return fetch('countries')
  }
})