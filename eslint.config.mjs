// @ts-check
// ESLint v9 flat config — requires `nuxt prepare` first to generate .nuxt/eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

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
      // Enforce <script setup> style
      'vue/component-api-style': ['error', ['script-setup']],
      // Consistent define macro order
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots', 'defineExpose'],
          defineExposeLast: true,
        },
      ],
    },
  },
)
