import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import importX from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx']

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.md',
      'eslint.config.js',
      'scripts/**',
      '**/vite.config.ts',
      'packages/eslint-config/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: TYPESCRIPT_FILES,
  })),
  {
    files: TYPESCRIPT_FILES,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: TYPESCRIPT_FILES,
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: TYPESCRIPT_FILES,
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': 'error',
    },
  },
  {
    files: TYPESCRIPT_FILES,
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'core', pattern: 'packages/core/**' },
        { type: 'package', pattern: 'packages/*' },
        { type: 'app', pattern: 'apps/*' },
      ],
    },
    rules: {
      // 第三方包由 npm/TS 管理，这里只约束工作区分层依赖
      'boundaries/no-unknown-dependencies': 'off',
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'core' } },
              disallow: [
                { to: { element: { type: 'core' } } },
                { to: { element: { type: 'package' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
            {
              from: { element: { type: 'package' } },
              disallow: [{ to: { element: { type: 'app' } } }],
            },
          ],
        },
      ],
    },
  },
]
