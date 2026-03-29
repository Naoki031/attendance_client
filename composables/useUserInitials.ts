export function useUserInitials() {
  const userStore = useUserStore()

  const initials = computed<string>(() => {
    const name = userStore.user?.full_name ?? ''
    const parts = name.trim().split(' ').filter(Boolean)
    const first = parts[0]?.[0] ?? ''
    const last = parts[parts.length - 1]?.[0] ?? ''
    if (parts.length >= 2) return (first + last).toUpperCase()
    if (parts.length === 1) return first.toUpperCase() || 'U'
    return 'U'
  })

  return { initials }
}
