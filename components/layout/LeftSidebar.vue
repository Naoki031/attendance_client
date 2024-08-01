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
    <v-list :lines="false" density="compact" nav v-model:opened="opened">
      <template v-for="(item, i) in items">
        <template v-if="item.type === 'divider'">
          <v-divider :inset="item.inset" :key="i"></v-divider>
        </template>
        <template v-else-if="item?.items">
          <v-list-group :key="i" :value="item.active">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.text"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="(child, j) in item.items"
              color="primary"
              :key="j"
              :to="child.link"
              @clickOnce="() => $router.push(child.link)"
              :active="child.link === $route.path"
              rounded="shaped"
              :prepend-icon="child.icon"
            >
              <v-list-item-title v-text="child.text"></v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
        <template v-else>
          <v-list-item
            color="primary"
            :key="i"
            :to="item.link"
            :active="item.link === $route.path"
            @clickOnce="() => $router.push(String(item.link))"
            rounded="shaped"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item>
        </template>
      </template>
    </v-list>
    <!-- logout -->
    <template v-slot:append>
      <v-list-item color="primary" @clickOnce="handleLogout" active>
        <template v-slot:prepend>
          <v-icon :icon="btnLogout.icon"></v-icon>
        </template>
        <v-list-item-title v-text="btnLogout.text"></v-list-item-title>
      </v-list-item>
    </template>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
/** 0. start import*/
import { computed, ref } from 'vue'
// import { useUserStore } from '@/piniaStore/user'
import { useRouter } from 'vue-router'
/* end import*/

/** 1. start import name component*/
/* end import*/

/** 2. start define property and emits */
/* end define property and emits*/

/** 3. start define validate */
/* end define validate */

/** 4. start defined state */
// const userStore = useUserStore()
const router = useRouter()

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

const btnLogout = {
  icon: 'mdi-logout',
  text: 'Logout',
  link: '/logout',
}

const hover = ref(false)
const opened = ref([])
/* end defined state */

/** 5. start defined computed */
// const isAuthenticated = computed(() => userStore.isAuthenticated)
const onChange = (val: boolean) => {
  if (val) {
    opened.value = []
  }
}
/* end defined computed */

/** 6. start defined methods */
const handleLogout = async () => {
  // await userStore.logout()
  const inBrowser = typeof window !== 'undefined'
  if (inBrowser) {
    window.location.href = '/login'
  }
}
/* end defined methods */

/** 7. start define watcher */
/* end define life watcher */

/** 8. start define life cycle hook */
/* end define life cycle hook */
</script>
