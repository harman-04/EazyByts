import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] }, // Ignore the 'dist' directory

  // --- Existing Configuration for your React components (browser-side) ---
  {
    files: ['**/*.{js,jsx}'], // Applies to all .js and .jsx files (e.g., in src/components)
    languageOptions: {
      ecmaVersion: 2020,
      // Use globals.browser for browser-side code (React components)
      globals: {
        ...globals.browser, // Spreading browser globals
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // --- NEW Configuration for your Firebase Service Worker file ---
  {
    files: ['public/firebase-messaging-sw.js'], // <<< TARGETS YOUR SERVICE WORKER FILE
    languageOptions: {
      ecmaVersion: 2020, // Or 'latest' as appropriate for your code
      // Use globals.worker for the Service Worker environment
      globals: {
        ...globals.worker, // Provides global variables like 'self', 'importScripts', 'caches'
        firebase: true,    // <<< Explicitly declare that 'firebase' global is available
      },
      parserOptions: {
        // Service workers often operate as 'scripts' rather than ES modules at the top level
        // due to `importScripts`.
        sourceType: 'script',
      },
    },
    rules: {
      // Apply base recommended JavaScript rules
      ...js.configs.recommended.rules,
      // You can add specific rules for your service worker here if needed.
      // For example, if you want to allow console.log in the service worker:
      // 'no-console': 'off',
    },
  },
];