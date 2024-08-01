import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: 'node-server',
    devProxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        prependPath: false,
      },
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1',
      NUXT_HOST: String(process.env.NUXT_HOST || 'localhost'),
      NUXT_PORT: String(process.env.NUXT_PORT || 3000),
    },
  },

  css: ['vuetify/lib/styles/main.sass', '@mdi/font/css/materialdesignicons.min.css'],

  build: {
    transpile: ['vuetify'],
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/devtools',
    (_options: any, nuxt: any) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    '@vee-validate/nuxt',
  ],

  pinia: {
    storesDirs: ['./stores/**'],
  },

  vite: {
    define: {
      'process.env.DEBUG': true,
    },
    server: {
      hmr: {
        host: 'localhost',
        protocol: 'ws',
        port: 24678,
      },
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  compatibilityDate: '2024-07-18',
})
