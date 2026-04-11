export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  if (userStore.isAuthenticated && to?.name === 'login') {
    return navigateTo('/home')
  }

  if (!userStore.isAuthenticated && to?.name !== 'login' && to?.name !== 'meetings-rsvp') {
    return navigateTo('/login')
  }

  // Protect management routes: only Admin and Super Admin may access /management/**
  // Role is sourced from the API profile response (stored in localStorage), not from JWT decoding.
  if (to.path.startsWith('/management') && !userStore.isAdmin) {
    return navigateTo('/home')
  }
})
