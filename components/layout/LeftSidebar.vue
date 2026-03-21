<template>
  <v-navigation-drawer
    v-model="drawerModel"
    :rail="mdAndUp ? true : undefined"
    :expand-on-hover="mdAndUp"
    :temporary="!mdAndUp"
    @update:rail="onChange"
  >
    <!-- User information -->
    <v-list>
      <v-list-item
        :title="userStore.user?.full_name ?? 'User'"
        :subtitle="userStore.user?.position ?? userStore.user?.email ?? ''"
      >
        <template #prepend>
          <v-avatar color="primary" size="36">
            <span class="text-caption text-white font-weight-bold">{{ sidebarInitials }}</span>
          </v-avatar>
        </template>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>

    <!-- Sidebar list -->
    <v-list v-model="opened" :lines="false" density="compact" nav>
      <template v-for="(route, i) in userRoutes">
        <template v-if="route.type === 'divider'">
          <v-divider :key="i" :inset="route.inset"></v-divider>
        </template>

        <template v-else-if="isRouteType(route) && route.children">
          <v-list-group :key="i" :value="route.active">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="route.icon"
                :title="route.text"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="(child, j) in route.children"
              :key="j"
              color="primary"
              :active="activeLink(child)"
              rounded="shaped"
              :prepend-icon="child.icon"
              @click="redirectTo(child)"
            >
              <v-list-item-title>{{ child.text }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>

        <template v-else-if="isRouteType(route)">
          <v-list-item
            :key="i"
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
          </v-list-item>
        </template>
      </template>

      <template v-if="userStore.isAdmin">
        <v-list-subheader>MANAGEMENT</v-list-subheader>
        <template v-for="(route, routeIndex) in adminRoutes">
          <template v-if="route.type === 'divider'">
            <v-divider :key="routeIndex" :inset="route.inset"></v-divider>
          </template>

          <template v-else-if="isRouteType(route) && route.children">
            <v-list-group :key="routeIndex" :value="route.active">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="route.icon"
                  :title="route.text"
                ></v-list-item>
              </template>
              <v-list-item
                v-for="(child, j) in route.children"
                :key="j"
                color="primary"
                :active="activeLink(child)"
                rounded="shaped"
                :prepend-icon="child.icon"
                @click="redirectTo(child)"
              >
                <v-list-item-title>{{ child.text }}</v-list-item-title>
              </v-list-item>
            </v-list-group>
          </template>

          <template v-else-if="isRouteType(route)">
            <v-list-item
              :key="routeIndex"
              color="primary"
              :active="activeLink(route)"
              rounded="shaped"
              @click="redirectTo(route)"
            >
              <template #prepend>
                <v-icon :icon="route.icon"></v-icon>
              </template>
              <v-list-item-title>{{ route.text }}</v-list-item-title>
            </v-list-item>
          </template>
        </template>
      </template>
    </v-list>

    <!-- logout -->
    <template #append>
      <v-list-item color="red" active @click="handleLogout">
        <template #prepend>
          <v-icon :icon="buttonLogout.icon"></v-icon>
        </template>
        <v-list-item-title>{{ buttonLogout.text }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
/** START IMPORT */
import type { RouteType, DividerType } from '@/types/index'
import { useDrawer } from '@/composables/useDrawer'
import { useDisplay } from 'vuetify'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const buttonLogout = {
  icon: 'mdi-logout',
  text: 'Logout',
  link: '/logout',
}

const userRoutes: Array<RouteType | DividerType> = [
  { icon: 'mdi-home-outline', text: 'Home', link: '/home' },
  { icon: 'mdi-account', text: 'Profile', link: '/profile' },
]

const adminRoutes: Array<RouteType | DividerType> = [
  { type: 'divider', inset: false },
  {
    icon: 'mdi-office-building',
    text: 'Company',
    link: '/management/companies',
    name: 'admin.companies.index',
  },
  {
    icon: 'mdi-map-marker',
    text: 'Location',
    link: '',
    active: 'Location',
    children: [
      { icon: '', text: 'List City', link: '/management/cities', name: 'admin.cities.index' },
      {
        icon: '',
        text: 'List Country',
        link: '/management/countries',
        name: 'admin.countries.index',
      },
    ],
  },
  {
    icon: 'mdi-account-group',
    text: 'Roles & Permissions',
    link: '',
    active: 'Management',
    children: [
      { icon: '', text: 'User', link: '/management/users', name: 'admin.users.index' },
      { icon: '', text: 'Role', link: '/management/roles', name: 'admin.roles.index' },

      {
        icon: '',
        text: 'Permission',
        link: '/management/permissions',
        name: 'admin.permissions.index',
      },

      {
        icon: '',
        text: 'Permission Group',
        link: '/management/permission-groups',
        name: 'admin.permission_groups.index',
      },
    ],
  },
]
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const router = useRouter()
const userStore = useUserStore()
const opened = ref([])
const { mdAndUp } = useDisplay()
const drawerState = useDrawer()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const drawerModel = computed({
  get: () => (mdAndUp.value ? true : drawerState.isOpen.value),
  set: (value: boolean) => {
    if (!mdAndUp.value) drawerState.isOpen.value = value
  },
})

const sidebarInitials = computed(() => {
  const name = userStore.user?.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()
  if (parts.length === 1) return first.toUpperCase() || 'U'

  return 'U'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const isRouteType = (route: RouteType | DividerType): route is RouteType => {
  return (route as RouteType).link !== undefined
}

const onChange = (value: boolean) => {
  if (value) {
    opened.value = []
  }
}

const activeLink = (route: RouteType) => {
  let resolvedPath = route.link

  if (route.name) {
    const resolvedRoute = router.resolve({ name: route.name })
    resolvedPath = resolvedRoute.path
  }

  return resolvedPath === router.currentRoute.value.path
}

const redirectTo = (route: RouteType) => {
  if (route.name) {
    router.push({ name: route.name })
  } else {
    router.push(route.link)
  }
}

const handleLogout = () => {
  userStore.logout().then(() => {
    router.replace({ name: 'login' })
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
