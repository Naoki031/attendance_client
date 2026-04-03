import { initializeApp, getApps } from 'firebase/app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey as string | undefined,
    authDomain: config.public.firebaseAuthDomain as string | undefined,
    projectId: config.public.firebaseProjectId as string | undefined,
    storageBucket: config.public.firebaseStorageBucket as string | undefined,
    messagingSenderId: config.public.firebaseMessagingSenderId as string | undefined,
    appId: config.public.firebaseAppId as string | undefined,
  }

  // Skip init if credentials are not configured
  if (!firebaseConfig.projectId) return

  // Avoid re-initializing on hot reload
  if (getApps().length === 0) {
    initializeApp(firebaseConfig)
  }
})
