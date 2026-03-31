import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  compatibilityDate: '2026-03-31',

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
    typeCheck: false,
  },

  // Nuxt automatically overrides runtimeConfig values from env vars:
  // apiBaseUrl → NUXT_PUBLIC_API_BASE_URL
  // wsUrl      → NUXT_PUBLIC_WS_URL
  // NUXT_HOST  → NUXT_PUBLIC_NUXT_HOST
  // NUXT_PORT  → NUXT_PUBLIC_NUXT_PORT
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:3001/api/v1',
      wsUrl: 'http://localhost:3001',
      NUXT_HOST: 'localhost',
      NUXT_PORT: '3000',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      firebaseVapidKey: '',
    },
  },

  // CSS load order: layers.css (must be first) → Vuetify styles → Tailwind → project overrides
  css: [
    '~/assets/styles/layers.css',
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/styles/tailwind.css',
    '~/assets/main.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/devtools',
    '@nuxt/eslint',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_options: any, nuxt: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nuxt.hooks.hook('vite:extendConfig', (config: any) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    '@vee-validate/nuxt',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales/',
    detectBrowserLanguage: false,
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false,
      cssMinify: 'lightningcss',
    },
    define: {
      'process.env.DEBUG': false,
    },
    optimizeDeps: {
      include: [
        'moment-timezone',
        'socket.io-client',
        'xlsx',
        'qrcode',
        'jsqr',
        'marked',
        'heic2any',
        'cropperjs',
        'firebase/app',
        'firebase/messaging',
      ],
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
