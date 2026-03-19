<template>
  <template>
    <v-layout class="border rounded" style="height: 128px">
      <v-bottom-navigation :active="active" color="indigo">
        <v-btn>
          <v-icon>mdi-history</v-icon>

          Recents
        </v-btn>

        <v-btn>
          <v-icon>mdi-heart</v-icon>

          Favorites
        </v-btn>

        <v-btn>
          <v-icon>mdi-map-marker</v-icon>

          Nearby
        </v-btn>
      </v-bottom-navigation>
    </v-layout>
  </template>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const active = ref<boolean>(true)
</script>
