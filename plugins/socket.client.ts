import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

let socket: Socket | null = null
let wsBaseUrl = 'http://localhost:3001'

function getToken(): string | null {
  if (!import.meta.client) return null

  return localStorage.getItem('token')
}

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): void {
  if (socket) return

  const token = getToken()
  if (!token) return

  socket = io(wsBaseUrl, {
    path: '/ws',
    auth: { token },
    transports: ['websocket'], // polling would send unauthenticated HTTP requests → 401 → auto-logout
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  })
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // Use configured wsUrl, or fall back to the current page origin so that
  // WebSocket works through any host (localhost, LAN IP, ngrok, etc.)
  wsBaseUrl = (config.public.wsUrl as string) || (import.meta.client ? window.location.origin : '')

  if (import.meta.client) {
    connectSocket()
  }

  return {
    provide: { connectSocket, disconnectSocket, getSocket },
  }
})
