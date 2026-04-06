import type { Ref } from 'vue'
import type { DefaultFilters } from '@/components/common/FilterPanel.vue'

/**
 * Generic CRUD page composable — eliminates identical boilerplate from 6+ management pages.
 *
 * @param service - Service class with static getAll() and delete() methods
 * @param options - Optional configuration for sorting, data transform, and filtering
 */
export function useCrudPage<
  T extends { id?: number | null },
  S extends {
    getAll: () => Promise<Record<string, T> | T[]>
    delete: (id: number) => Promise<unknown>
    filter?: (parameters: Record<string, unknown>) => Promise<Record<string, T> | T[]>
  },
>(
  service: S,
  options?: {
    defaultSortKey?: string
    transformData?: (raw: Record<string, T> | T[]) => T[]
    filters?: DefaultFilters
    getFilters?: () => DefaultFilters
    hasActiveFilter?: (filters: DefaultFilters) => boolean
  },
) {
  const { t } = useI18n()
  const defaultSortKey = options?.defaultSortKey ?? 'name'

  /** START DEFINE STATE */
  const items = ref<T[]>([]) as Ref<T[]>
  const isLoading = ref(false)
  const errorSnackbar = ref(false)
  const errorMessage = ref('')
  const dialog = ref(false)
  const dialogDelete = ref(false)
  const editedIndex = ref(-1)
  const editedItem = ref<T | null>(null)
  const entityToDelete = ref<T | null>(null)
  const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
    { key: defaultSortKey, order: 'asc' },
  ])

  // Filter state
  const filterExpanded = ref(false)
  const filters = ref<DefaultFilters>(options?.filters ?? { search: '' })
  let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null
  /* END DEFINE STATE */

  /** START DEFINE COMPUTED */
  const activeFilterCount = computed(() => {
    return Object.values(filters.value).filter(
      (filterValue) => filterValue !== '' && filterValue !== null && filterValue !== undefined,
    ).length
  })

  const isFilterActive = computed(() => {
    if (options?.hasActiveFilter) return options.hasActiveFilter(filters.value)

    return activeFilterCount.value > 0
  })
  /* END DEFINE COMPUTED */

  /** START DEFINE METHOD */
  const fetchData = async () => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      let raw: Record<string, T> | T[]

      if (isFilterActive.value && service.filter) {
        raw = await service.filter(filters.value as Record<string, unknown>)
      } else {
        raw = await service.getAll()
      }

      if (options?.transformData) {
        items.value = options.transformData(raw)
      } else {
        items.value = Array.isArray(raw) ? raw : Object.values(raw)
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('common.error')
      errorSnackbar.value = true
    } finally {
      isLoading.value = false
    }
  }

  const addItem = () => {
    editedItem.value = null
    dialog.value = true
  }

  const editItem = (item: T) => {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = { ...item }
    dialog.value = true
  }

  const onConfirm = async () => {
    onClose()
    await fetchData()
  }

  const onClose = () => {
    dialog.value = false
    nextTick(() => {
      editedIndex.value = -1
    })
  }

  const deleteItem = (item: T) => {
    entityToDelete.value = { ...item }
    dialogDelete.value = true
  }

  const onConfirmDelete = async (item: T) => {
    try {
      dialogDelete.value = false
      await nextTick()

      if (item.id) {
        await service.delete(item.id)
        await fetchData()
        entityToDelete.value = null
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('common.error')
      errorSnackbar.value = true
    }
  }

  const onCloseDelete = () => {
    dialogDelete.value = false
    nextTick(() => {
      entityToDelete.value = null
    })
  }

  const resetFilters = () => {
    const reset: Record<string, unknown> = {}

    for (const key of Object.keys(filters.value)) {
      reset[key] = ''
    }

    filters.value = reset as DefaultFilters
  }
  /* END DEFINE METHOD */

  /** START DEFINE WATCHER */
  if (options?.filters) {
    watch(
      filters,
      () => {
        if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
        filterDebounceTimer = setTimeout(() => {
          fetchData()
        }, 300)
      },
      { deep: true },
    )
  }
  /* END DEFINE WATCHER */

  /** START DEFINE LIFE CYCLE HOOK */
  onMounted(() => {
    fetchData()
  })
  /* END DEFINE LIFE CYCLE HOOK */

  return {
    // State
    items,
    isLoading,
    errorSnackbar,
    errorMessage,
    dialog,
    dialogDelete,
    editedIndex,
    editedItem,
    entityToDelete,
    sortBy,
    // Filter state
    filters,
    filterExpanded,
    activeFilterCount,
    isFilterActive,
    // Methods
    fetchData,
    addItem,
    editItem,
    onConfirm,
    onClose,
    deleteItem,
    onConfirmDelete,
    onCloseDelete,
    resetFilters,
  }
}
