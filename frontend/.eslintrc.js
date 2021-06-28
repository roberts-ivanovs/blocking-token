module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/require-default-props': [0],
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'no-prototype-builtins': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': [
      1,
      {
        extensions: ['.js', '.jsx', '.tsx', '.ts'],
      },
    ],
    'no-void': ['off'],
    quotes: [2, 'single', { avoidEscape: true }],
  },
};
