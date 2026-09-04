const js = require('@eslint/js');
const html = require('eslint-plugin-html');
const globals = require('globals');

/* Possible-problems only. Formatting and taste are out of scope.
   Unused arguments (event `e`, unused catch) are ignored; unused locals are not. */
const bugRules = {
  'no-empty': 'off',
  'no-extra-boolean-cast': 'off',
  'no-useless-escape': 'off',
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'docs/**',
      'test-results/**',
      'playwright-report/**',
      'index.html',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.html'],
    plugins: { html },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.browser,
    },
    rules: bugRules,
  },
  {
    files: ['src/app.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, LOGO: 'readonly', FONT_FACES: 'readonly' },
    },
    rules: {
      ...bugRules,
      // called from boot.js after the assembler concatenates the two files
      'no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        varsIgnorePattern: '^(bakeFieldThumbs|initGridLogo|initText)$',
      }],
    },
  },
  {
    files: ['src/boot.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        S: 'writable',
        clampDim: 'readonly',
        applyRatioScale: 'readonly',
        syncSliders: 'readonly',
        renderPalette: 'readonly',
        applyMask: 'readonly',
        meta: 'readonly',
        initGridLogo: 'readonly',
        initText: 'readonly',
        syncMaskToAlign: 'readonly',
        bakeFieldThumbs: 'readonly',
        setPaused: 'readonly',
        applyBrand: 'readonly',
      },
    },
    rules: bugRules,
  },
  {
    files: ['**/*.js'],
    ignores: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: bugRules,
  },
];
