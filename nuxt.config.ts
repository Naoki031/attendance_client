import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  devtools: { enabled: true },

  compatibilityDate: '2025-01-01',

  imports: {
    presets: [
      {
        from: 'vee-validate',
        imports: ['useField', 'useForm'],
      },
    ],
  },

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

  // Nuxt automatically overrides runtimeConfig values from env vars:
  // apiBaseUrl → NUXT_PUBLIC_API_BASE_URL
  // NUXT_HOST  → NUXT_PUBLIC_NUXT_HOST
  // NUXT_PORT  → NUXT_PUBLIC_NUXT_PORT
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:3001/api/v1',
      NUXT_HOST: 'localhost',
      NUXT_PORT: '3000',
    },
  },

  // Vuetify 4: import path changed from 'vuetify/lib/styles/main.sass'
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.min.css'],

  build: {
    transpile: ['vuetify'],
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/devtools',
    '@nuxt/eslint',
    (_options: any, nuxt: any) => {
      nuxt.hooks.hook('vite:extendConfig', (config: any) => {
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
      'process.env.DEBUG': false,
    },
    ssr: {
      noExternal: ['vuetify'],
    },
    server: {
      hmr: {
        host: '0.0.0.0',
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
})
