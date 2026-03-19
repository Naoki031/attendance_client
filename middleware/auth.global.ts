export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  if (userStore.isAuthenticated && to?.name === 'login') {
    return navigateTo('/home')
  }

  if (!userStore.isAuthenticated && to?.name !== 'login') {
    return navigateTo('/login')
  }
})
