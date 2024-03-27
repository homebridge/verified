const { antfu } = require('@antfu/eslint-config')

module.exports = antfu({
  ignores: [
    'node_modules',
  ],
  typescript: true,
  formatters: {
    markdown: true,
  },
  rules: {
    'antfu/if-newline': 0,
    'antfu/top-level-function': 0,
    'curly': ['error', 'multi-line'],
    'import/extensions': ['error', 'ignorePackages'],
    'import/order': 0,
    'no-console': 0,
    'no-undef': 'error',
    'perfectionist/sort-exports': 'error',
    'perfectionist/sort-imports': [
      'error',
      {
        groups: [
          'type',
          'internal-type',
          'builtin',
          'external',
          'internal',
          ['parent-type', 'sibling-type', 'index-type'],
          ['parent', 'sibling', 'index'],
          'object',
          'unknown',
        ],
        order: 'asc',
        type: 'natural',
      },
    ],
    'perfectionist/sort-named-exports': 'error',
    'perfectionist/sort-named-imports': 'error',
    'quotes': ['error', 'single'],
    'sort-imports': 0,
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'style/quote-props': ['error', 'consistent-as-needed'],
    'unicorn/no-useless-spread': 'error',
    'yaml/quotes': ['error', {
      avoidEscape: true,
      prefer: 'double',
    }],
  },
})
