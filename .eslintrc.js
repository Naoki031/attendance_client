module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@nuxtjs/eslint-config-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  plugins: [
    'vue', // Plugin Vue
    '@typescript-eslint', // Plugin TypeScript
    'prettier', // Plugin Prettier
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        singleQuote: true,
        semi: false,
        tabWidth: 2,
        trailingComma: 'none',
        printWidth: 100,
        bracketSpacing: true,
        arrowParens: 'always',
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'vue/attribute-hyphenation': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/no-v-model-argument': 'off',
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/no-v-model-argument': 'off',
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
