import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  // 仅提供 TS/JSX 解析能力，不加整套 style 规则（存量代码风格问题很多）
  tseslint.configs.base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // 核心防线：静态拦截「提前 return 后用 Hook / 条件调用 Hook」等运行时崩溃
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.{js,mjs}', '*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  }
);
