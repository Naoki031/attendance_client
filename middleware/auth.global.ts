import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  if (userStore.isAuthenticated && to?.name === 'login') {
    return navigateTo('/home')
  }

  if (!userStore.isAuthenticated && to?.name !== 'login') {
    return navigateTo('/login')
  }
})
