import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'index.html', 'turbotok-site.html'],
  },
  {
    files: ['app.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Loaded from CDN in index.html
        lucide: 'readonly',
        Chart: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-undef': 'error',
      // Top-level functions in app.js are the API for inline on* handlers in
      // index.html, so ESLint cannot see their call sites - check locals only.
      'no-unused-vars': ['warn', { vars: 'local', args: 'none' }],
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      eqeqeq: ['warn', 'smart'],
    },
  },
  {
    files: ['test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
];
