<template>
  <v-app>
    <Header />
    <LeftSidebar />
    <v-main>
      <NuxtPage />
    </v-main>
    <RightSidebar />
    <Footer />
  </v-app>
</template>

<script setup lang="ts">
import Header from "~/components/layout/Header.vue";
import Footer from "~/components/layout/Footer.vue";
import RightSidebar from "~/components/layout/RightSidebar.vue";
import LeftSidebar from "~/components/layout/LeftSidebar.vue";
</script>

<style scoped></style>
