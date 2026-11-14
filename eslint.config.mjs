// Configuracion de ESLint (flat config, ESLint 9) para todo el monorepo.
// Cada workspace ejecuta `eslint .` y ESLint encuentra este archivo subiendo
// desde su carpeta.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

const reglasGenerales = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-var': 'error',
  'prefer-const': 'error',
  eqeqeq: ['error', 'always'],
  'no-nested-ternary': 'warn',
}

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.supabase/**'],
  },

  js.configs.recommended,

  // App web (React)
  {
    files: ['apps/web/**/*.{js,jsx}'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,

      /* ═══════════════════════════════════════════
         REGLAS DE HOOKS — ESTRICTAS, SIN EXCEPCIONES
         ═══════════════════════════════════════════ */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      ...reglasGenerales,
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
  },

  // Archivos de configuracion de Node (vite.config.js, vitest.config.js)
  {
    files: ['apps/web/*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Pruebas
  {
    files: ['**/*.test.{js,jsx}', '**/pruebas/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },

  // Paquete compartido (JS puro)
  {
    files: ['packages/shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: reglasGenerales,
  },
]
