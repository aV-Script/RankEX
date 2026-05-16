import js           from '@eslint/js'
import react        from 'eslint-plugin-react'
import reactHooks   from 'eslint-plugin-react-hooks'
import globals      from 'globals'

export default [
  { ignores: ['dist', 'node_modules', 'scripts', 'src/dev'] },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType:  'module',
      globals:     globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'react':       react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',  // non necessario con Vite (JSX transform)
      'react/prop-types':         'off',  // no TypeScript — prop-types non usati nel progetto
      'react/no-unescaped-entities': 'off',  // testo italiano con apostrofi

      // ── Hooks ─────────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Qualità codice ────────────────────────────────────────────────
      'no-console':      ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars':  ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-undef':        'error',

      // ── Off — pattern legittimi nel progetto ──────────────────────────
      'no-empty':        ['error', { allowEmptyCatch: true }],  // catch {} ottimistic updates
    },
  },
]
