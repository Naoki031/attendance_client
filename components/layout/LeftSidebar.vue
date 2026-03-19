<template>
  <v-navigation-drawer rail expand-on-hover @update:rail="onChange">
    <!-- User information -->
    <v-list>
      <v-list-item prepend-avatar="https://avatars.githubusercontent.com/u/132861531?v=4" title="abasd">
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
              <v-list-item v-bind="props" :prepend-icon="route.icon" :title="route.text"></v-list-item>
            </template>
            <v-list-item v-for="(child, j) in route.children" :key="j" color="primary" :active="activeLink(child)"
              rounded="shaped" :prepend-icon="child.icon" @click="redirectTo(child)">
              <v-list-item-title>{{ child.text }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>

        <template v-else-if="isRouteType(route)">
          <v-list-item :key="i" color="primary" :to="route.link" :active="activeLink(route)" rounded="shaped"
            @click="redirectTo(route)">
            <template #prepend>
              <v-icon :icon="route.icon"></v-icon>
            </template>
            <v-list-item-title>{{ route.text }}</v-list-item-title>
          </v-list-item>
        </template>
      </template>

      <v-list-subheader>MANAGEMENT</v-list-subheader>
      <template v-for="(route, routeIndex) in adminRoutes">
        <template v-if="route.type === 'divider'">
          <v-divider :key="routeIndex" :inset="route.inset"></v-divider>
        </template>

        <template v-else-if="isRouteType(route) && route.children">
          <v-list-group :key="routeIndex" :value="route.active">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="route.icon" :title="route.text"></v-list-item>
            </template>
            <v-list-item v-for="(child, j) in route.children" :key="j" color="primary" :active="activeLink(child)"
              rounded="shaped" :prepend-icon="child.icon" @click="redirectTo(child)">
              <v-list-item-title>{{ child.text }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>

        <template v-else-if="isRouteType(route)">
          <v-list-item :key="routeIndex" color="primary" :active="activeLink(route)" rounded="shaped"
            @click="redirectTo(route)">
            <template #prepend>
              <v-icon :icon="route.icon"></v-icon>
            </template>
            <v-list-item-title>{{ route.text }}</v-list-item-title>
          </v-list-item>
        </template>
      </template>
    </v-list>

    <!-- logout -->
    <template #append>
      <v-list-item color="red" active @click="handleLogout">
        <template #prepend>
          <v-icon :icon="btnLogout.icon"></v-icon>
        </template>
        <v-list-item-title>{{ btnLogout.text }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
/** START IMPORT */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { RouteType, DividerType } from '@/types/index'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const btnLogout = {
  icon: 'mdi-logout',
  text: 'Logout',
  link: '/logout',
}

const userRoutes: Array<RouteType | DividerType> = [
  { icon: 'mdi-view-dashboard', text: 'Dashboard', link: '/dashboard' },
  { icon: 'mdi-account', text: 'Profile', link: '/profile' },
  { type: 'divider', inset: false },
  { icon: 'mdi-cog-outline', text: 'Settings', link: '/settings' },
]

const adminRoutes: Array<RouteType | DividerType> = [
  { type: 'divider', inset: false },
  {
    icon: 'mdi-map-marker',
    text: 'Location',
    link: '',
    active: 'Location',
    children: [
      // { icon: '', text: 'List City', link: '/management/cities', name: 'admin.cities.index' },
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
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const isRouteType = (route: RouteType | DividerType): route is RouteType => {
  return (route as RouteType).link !== undefined
}

const onChange = (val: boolean) => {
  if (val) {
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
