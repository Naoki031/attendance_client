module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-recommended', // Use Vue 3 recommended rules
    'eslint:recommended', // Use ESLint recommended rules
    '@nuxtjs/eslint-config-typescript', // Use Nuxt.js TypeScript rules
    'plugin:@typescript-eslint/recommended', // Use TypeScript recommended rules
    'plugin:prettier/recommended', // Use Prettier recommended rules
  ],
  parser: 'vue-eslint-parser', // Use Vue ESLint parser
  parserOptions: {
    ecmaVersion: 2021, // Use ECMAScript 2021
    parser: '@typescript-eslint/parser', // Use Vue ESLint parser
    sourceType: 'module', // Use ECMAScript modules
  },
  plugins: [
    'vue', // Plugin for Vue
    '@typescript-eslint', // Plugin for TypeScript
    'prettier', // Plugin for Prettier
    'eslint-plugin-vue', // Plugin for Vue
    'eslint-plugin-nuxt', // Plugin for Nuxt.js
  ],
  rules: {
    'prettier/prettier': ['error', { singleQuote: true, semi: false }], // Prettier rules for single quotes and no semicolons
    '@typescript-eslint/no-unused-vars': ['error'], // Error when unused variable
    '@typescript-eslint/explicit-module-boundary-types': 'error', // Error when missing return type
    '@typescript-eslint/no-explicit-any': 'warn', // Warn when using any type
    'vue/no-multiple-template-root': 'off', // Allow multiple root elements in Vue template
    'vue/valid-v-slot': 'off', // Allow shorthand syntax for v-slot
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/no-v-model-argument': 'off', // Disable no-v-model-argument for .vue files
        'vue/valid-v-slot': 'off',
        'vue/v-slot-style': [
          'error',
          {
            atComponent: 'shorthand',
            default: 'shorthand',
          },
        ],
      },
    },
  ],
}
