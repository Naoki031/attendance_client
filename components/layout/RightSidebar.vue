<template>
  <v-navigation-drawer location="right">
    <v-list lines="one" density="compact">
      <v-list-item
        v-for="(item, i) in items"
        :key="i"
        :value="item"
        color="primary"
        :prepend-avatar="item.prependAvatar"
      >
        <v-list-item-title v-text="item.title"></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
/** 0. start import*/
import { computed } from "vue";
// import { useUserStore } from "@/stores/user";
/* end import*/

/** 1. start import name component*/
/* end import*/

/** 2. start define property and emits */
// const userStore = useUserStore();

const items = [
  {
    prependAvatar: "https://cdn.vuetifyjs.com/images/lists/1.jpg",
    title: "Brunch this weekend?",
  },
  {
    prependAvatar: "https://cdn.vuetifyjs.com/images/lists/2.jpg",
    title: "Summer BBQ",
  },
  {
    prependAvatar: "https://cdn.vuetifyjs.com/images/lists/3.jpg",
    title: "Oui oui",
  },
  {
    prependAvatar: "https://cdn.vuetifyjs.com/images/lists/4.jpg",
    title: "Birthday gift",
  },
  {
    prependAvatar: "https://cdn.vuetifyjs.com/images/lists/5.jpg",
    title: "Recipe to try",
  },
];
/* end define property and emits*/

/** 3. start define validate */
/* end define validate */

/** 4. start defined state */
/* end defined state */

/** 5. start defined computed */
// const isAuthenticated = computed(() => userStore.isAuthenticated);
/* end defined computed */

/** 6. start defined methods */
/* end defined methods */

/** 7. start define watcher */
/* end define life watcher */

/** 8. start define life cycle hook */
/* end define life cycle hook */
</script>
