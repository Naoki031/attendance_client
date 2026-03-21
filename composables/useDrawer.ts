/**
 * Shared drawer state for the navigation sidebar.
 * Uses Nuxt's useState so the value is consistent across SSR and client hydration.
 */
export const useDrawer = () => {
  const isOpen = useState<boolean>('drawer_open', () => false)

  return {
    isOpen,
    toggle: () => {
      isOpen.value = !isOpen.value
    },
    close: () => {
      isOpen.value = false
    },
  }
}
