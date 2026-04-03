import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { getApps } from 'firebase/app'
import { apiClient } from '@/utils/apiClient'

/**
 * Composable for Firebase Cloud Messaging.
 * Requests notification permission, registers the FCM token with the API,
 * and sets up a foreground message handler.
 */
export function useFirebaseMessaging() {
  const config = useRuntimeConfig()

  /**
   * Requests notification permission, gets the FCM token, and saves it to the API.
   * Safe to call multiple times — skips if already registered or unsupported.
   */
  async function initMessaging(
    onForegroundMessage: (payload: {
      title?: string
      body?: string
      data?: Record<string, string>
    }) => void,
  ): Promise<void> {
    if (!config.public.firebaseVapidKey || !config.public.firebaseProjectId) return
    if (getApps().length === 0) return

    try {
      const supported = await isSupported()
      if (!supported) return

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      await navigator.serviceWorker.ready

      const messaging = getMessaging()
      const token = await getToken(messaging, {
        vapidKey: config.public.firebaseVapidKey as string,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        await apiClient.post('users/me/fcm-token', { fcm_token: token })
      }

      // Handle foreground messages (app is open)
      onMessage(messaging, (payload) => {
        onForegroundMessage({
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data as Record<string, string> | undefined,
        })
      })
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error)
    }
  }

  return { initMessaging }
}
