<template>
  <v-navigation-drawer rail expand-on-hover @update:rail="onChange">
    <!-- User information -->
    <v-list>
      <v-list-item
        prepend-avatar="https://avatars.githubusercontent.com/u/132861531?v=4"
        title="abasd"
      >
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <!-- Sidebar list -->
    <v-list v-model="opened" :lines="false" density="compact" nav>
      <template v-for="(item, i) in items">
        <template v-if="item.type === 'divider'">
          <v-divider :key="i" :inset="item.inset"></v-divider>
        </template>
        <template v-else-if="item?.items">
          <v-list-group :key="i" :value="item.active">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.text"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="(child, j) in item.items"
              :key="j"
              color="primary"
              :to="child.link"
              :active="child.link === router.currentRoute.value.path"
              rounded="shaped"
              :prepend-icon="child.icon"
              @click-once="() => router.push(child.link)"
            >
              <v-list-item-title>{{ child.text }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
        <template v-else>
          <v-list-item
            :key="i"
            color="primary"
            :to="item.link"
            :active="item.link === router.currentRoute.value.path"
            rounded="shaped"
            @click-once="() => router.push(String(item.link))"
          >
            <template #prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
        </template>
      </template>
    </v-list>
    <!-- logout -->
    <template #append>
      <v-list-item color="primary" active @click-once="handleLogout">
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
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const btnLogout = {
  icon: 'mdi-logout',
  text: 'Logout',
  link: '/logout',
}
const items = [
  // { icon: 'mdi-book-open', text: 'Meeting Rooms', link: '/meeting-rooms' },
  // {
  //   icon: 'mdi-gamepad-variant',
  //   text: 'Games',
  //   link: '/games',
  //   active: 'Games',
  //   items: [
  //     { icon: 'mdi-gamepad-variant', text: 'Wheel fortune', link: '/games/wheelfortune' },
  //     { icon: 'mdi-gamepad-variant', text: 'Game one', link: '/games/2' },
  //     { icon: 'mdi-gamepad-variant', text: 'Game two', link: '/games/3' },
  //   ],
  // },
  // { icon: 'mdi-ballot', text: 'Tasks', link: '/tasks' },
  { type: 'divider', inset: false },
  {
    icon: 'mdi-map-marker',
    text: 'Location',
    link: '/locations',
    active: 'Location',
    items: [
      { icon: '', text: 'List City', link: '/cities' },
      { icon: '', text: 'List Country', link: '/countries' },
    ],
  },
  { icon: 'mdi-cog-outline', text: 'Settings', link: '/settings' },
]
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const router = useRouter()
const opened = ref([])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onChange = (val: boolean) => {
  if (val) {
    opened.value = []
  }
}

const handleLogout = () => {
  // await userStore.logout()
  const inBrowser = typeof window !== 'undefined'
  if (inBrowser) {
    window.location.href = '/login'
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
