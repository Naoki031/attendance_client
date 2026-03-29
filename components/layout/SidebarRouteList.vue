<template>
  <template v-for="(route, routeIndex) in routes">
    <template v-if="route.type === 'divider'">
      <v-divider :key="routeIndex" :inset="route.inset"></v-divider>
    </template>

    <template v-else-if="isRouteType(route) && route.children">
      <v-list-group :key="routeIndex" :value="route.active">
        <template #activator="{ props }">
          <v-list-item v-bind="props" :prepend-icon="route.icon" :title="route.text"></v-list-item>
        </template>
        <v-list-item
          v-for="(child, childIndex) in route.children"
          :key="childIndex"
          color="primary"
          :active="activeLink(child)"
          rounded="shaped"
          :prepend-icon="child.icon"
          @click="redirectTo(child)"
        >
          <v-list-item-title>{{ child.text }}</v-list-item-title>
          <template v-if="child.name && badgeNames?.includes(child.name) && badgeCount" #append>
            <v-badge :content="badgeCount" color="error" inline></v-badge>
          </template>
        </v-list-item>
      </v-list-group>
    </template>

    <template v-else-if="isRouteType(route)">
      <v-list-item
        :key="routeIndex"
        color="primary"
        :to="route.link"
        :active="activeLink(route)"
        rounded="shaped"
        @click="redirectTo(route)"
      >
        <template #prepend>
          <v-icon :icon="route.icon"></v-icon>
        </template>
        <v-list-item-title>{{ route.text }}</v-list-item-title>
        <template v-if="route.name && badgeNames?.includes(route.name) && badgeCount" #append>
          <v-badge :content="badgeCount" color="error" inline></v-badge>
        </template>
      </v-list-item>
    </template>
  </template>
</template>

<script lang="ts" setup>
// START IMPORT
import type { RouteType, DividerType } from '@/types'
// END IMPORT

// START DEFINE PROPERTY AND EMITS
defineProps<{
  routes: Array<RouteType | DividerType>
  /** Route names that should display the badge */
  badgeNames?: string[]
  /** Badge count to display */
  badgeCount?: number
}>()

const emit = defineEmits<{
  navigate: [route: RouteType]
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const router = useRouter()
// END DEFINE STATE

// START DEFINE METHOD
const isRouteType = (route: RouteType | DividerType): route is RouteType => {
  return (route as RouteType).link !== undefined
}

const activeLink = (route: RouteType) => {
  const resolvedPath = route.name ? router.resolve({ name: route.name }).path : route.link

  return resolvedPath === router.currentRoute.value.path
}

const redirectTo = (route: RouteType) => {
  if (route.name) {
    router.push({ name: route.name })
    emit('navigate', route)

    return
  }

  router.push(route.link)
  emit('navigate', route)
}
// END DEFINE METHOD
</script>
