import { onMounted, onUnmounted } from 'vue'
import { getSocket, connectSocket } from '@/plugins/socket.client'

/**
 * Subscribes to a socket.io event for the lifetime of the calling component.
 * Automatically connects the socket if not yet connected.
 * Re-registers the listener on reconnect to prevent event loss.
 * Cleans up the listener on component unmount.
 */
export function useSocketEvent<T>(event: string, handler: (data: T) => void): void {
  const register = () => {
    const socket = getSocket()

    if (socket) {
      socket.on(event, handler)
    }
  }

  const unregister = () => {
    const socket = getSocket()

    if (socket) {
      socket.off(event, handler)
    }
  }

  onMounted(() => {
    connectSocket()
    register()

    // Re-register on reconnect to ensure listener is active after connection drops
    const socket = getSocket()

    if (socket) {
      socket.on('connect', register)
    }
  })

  onUnmounted(() => {
    unregister()
    const socket = getSocket()

    if (socket) {
      socket.off('connect', register)
    }
  })
}
