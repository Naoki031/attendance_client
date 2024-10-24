// import { storeToRefs } from 'pinia'
import { defineNuxtRouteMiddleware, navigateTo, abortNavigation, useCookie } from '#app'
import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  if (userStore.isAuthenticated && to?.name === 'login') {
    return navigateTo('/')
  }

  if (!userStore.isAuthenticated && to?.name !== 'login') {
    abortNavigation()
    return navigateTo('/login')
  }
})
