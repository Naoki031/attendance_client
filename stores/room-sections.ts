import { defineStore } from 'pinia'
import type { RoomSectionModel } from '@/interfaces/models/RoomSectionModel'
import RoomSectionService from '@/services/RoomSectionService'

export const useRoomSectionsStore = defineStore('room-sections', () => {
  const sections = ref<RoomSectionModel[]>([])
  const isLoaded = ref(false)

  /**
   * Loads sections from the API (once per session unless forced).
   */
  async function load(force = false) {
    if (isLoaded.value && !force) return
    try {
      sections.value = await RoomSectionService.getAll()
      isLoaded.value = true
    } catch (error) {
      console.error('Failed to load room sections:', error)
    }
  }

  /**
   * Returns the section ID that contains the given resource, or null.
   */
  function getSectionForResource(
    resourceType: 'meeting' | 'chat_room',
    resourceId: number,
  ): number | null {
    for (const section of sections.value) {
      const found = (section.items ?? []).some(
        (item) => item.resource_type === resourceType && item.resource_id === resourceId,
      )
      if (found) return section.id
    }
    return null
  }

  /**
   * Creates a new section and updates local state.
   */
  async function createSection(name: string): Promise<RoomSectionModel> {
    const created = await RoomSectionService.create({ name })
    sections.value.push(created)
    return created
  }

  /**
   * Renames a section and updates local state.
   */
  async function renameSection(id: number, name: string): Promise<void> {
    const updated = await RoomSectionService.update(id, { name })
    const index = sections.value.findIndex((section) => section.id === id)
    if (index !== -1) sections.value[index] = updated
  }

  /**
   * Deletes a section and updates local state.
   */
  async function deleteSection(id: number): Promise<void> {
    await RoomSectionService.delete(id)
    sections.value = sections.value.filter((section) => section.id !== id)
  }

  /**
   * Moves a resource into a section (or null to remove from all sections).
   */
  async function moveToSection(
    resourceType: 'meeting' | 'chat_room',
    resourceId: number,
    targetSectionId: number | null,
  ): Promise<void> {
    // Find current section BEFORE clearing local state
    const currentSectionId = getSectionForResource(resourceType, resourceId)

    // Remove from current section in local state
    for (const section of sections.value) {
      section.items = (section.items ?? []).filter(
        (item) => !(item.resource_type === resourceType && item.resource_id === resourceId),
      )
    }

    if (targetSectionId === null) {
      if (currentSectionId) {
        await RoomSectionService.removeItem(currentSectionId, resourceType, resourceId)
      }
      return
    }

    const updated = await RoomSectionService.addItem(targetSectionId, resourceType, resourceId)
    const index = sections.value.findIndex((section) => section.id === targetSectionId)
    if (index !== -1) sections.value[index] = updated
  }

  return {
    sections,
    isLoaded,
    load,
    getSectionForResource,
    createSection,
    renameSection,
    deleteSection,
    moveToSection,
  }
})
