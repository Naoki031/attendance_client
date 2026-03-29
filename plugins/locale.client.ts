/**
 * Sync the UI locale with the authenticated user's preferred_language from the DB.
 * Runs client-side only. Watches the userStore.user and applies the locale whenever it loads.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const userStore = useUserStore()

  const ALLOWED_LOCALES = ['en', 'vi', 'ja']

  watch(
    () => userStore.user?.preferred_language,
    (language) => {
      if (language && ALLOWED_LOCALES.includes(language)) {
        nuxtApp.$i18n.setLocale(language)
      }
    },
    { immediate: true },
  )
})
