<template>
  <v-menu min-width="140">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" class="text-white mr-1" size="small">
        <v-icon icon="mdi-translate" size="18" class="mr-1"></v-icon>
        <span class="text-caption font-weight-bold">{{ currentLocaleLabel }}</span>
        <v-icon icon="mdi-chevron-down" size="16" class="ml-1"></v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="locale in availableLocales"
        :key="locale.code"
        :title="locale.name"
        :active="locale.code === currentLocale"
        active-color="primary"
        @click="changeLanguage(locale.code)"
      ></v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
/** START IMPORT */
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const { locale: currentLocale, setLocale, locales } = useI18n()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).map((locale) => ({
    code: locale.code,
    name: locale.name,
  })),
)

const currentLocaleLabel = computed<string>(() => currentLocale.value.toUpperCase())
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const changeLanguage = async (code: string) => {
  await setLocale(code as 'en' | 'vi' | 'ja')
  await userStore.updateLanguage(code)
}
/* END DEFINE METHOD */
</script>
