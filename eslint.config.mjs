// @ts-check
// ESLint v9 flat config — requires `nuxt prepare` first to generate .nuxt/eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import unicorn from 'eslint-plugin-unicorn'

export default withNuxt(
  // Prettier: disables conflicting ESLint rules and runs Prettier as a linter rule
  prettierRecommended,

  // Custom rule overrides
  {
    files: ['**/*.ts', '**/*.vue', '**/*.mjs'],
    rules: {
      // Prettier formatting — mirror .prettierrc exactly
      'prettier/prettier': [
        'error',
        {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          singleQuote: true,
          trailingComma: 'all',
          bracketSpacing: true,
          arrowParens: 'always',
          endOfLine: 'lf',
          semi: false,
        },
      ],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Vue — Nuxt file-based routing uses single-word names (index.vue etc.)
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      // Vuetify uses v-slot:item.name dot notation — disable modifier restriction
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      // Enforce <script setup> style
      'vue/component-api-style': ['error', ['script-setup']],
      // Services use static-only classes by convention
      '@typescript-eslint/no-extraneous-class': 'off',
      // void is valid as a generic type argument e.g. apiClient.put<void>()
      '@typescript-eslint/no-invalid-void-type': ['error', { allowInGenericTypeArguments: true }],
      // Consistent define macro order
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'],
          defineExposeLast: true,
        },
      ],

      // No single-character variable or parameter names (except _ for ignored vars)
      'id-length': ['error', { min: 2, exceptions: ['_'], properties: 'never' }],

      // Bare 'id' as a parameter is forbidden — use entity-specific name (userId, countryId, etc.)
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) > .params > Identifier[name="id"]',
          message:
            'Use a descriptive ID parameter name (e.g., userId, countryId) instead of bare "id".',
        },
      ],

      // No abbreviations — identifiers must be written in full
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            // Vue / Nuxt conventions — not abbreviations
            props: true,
            Props: true,
          },
        },
      ],
    },
    plugins: { unicorn },
  },
)
