import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import jslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']), // 忽略 dist 和 node_modules 目录
  {
    files: ['**/*.{ts,js}'], // 对所有 TS JS 文件应用规则
    languageOptions: {
      ecmaVersion: 2020, // 语法检查 支持的 ES 版本
      globals: globals.browser, // 浏览器全局变量
      // env: globals.node, // Node.js 环境变量
    },
    settings: {
      react: {
        version: 'detect', // 自动检测 React 版本
      },
      jsdoc: {
        mode: 'typescript',
      },
    },
    extends: [
      prettier, // ✅ 关闭和 Prettier 冲突的规则
      jslint.configs.recommended, // ✅ JavaScript 规则
      ...tseslint.configs.recommended, // ✅ TypeScript 规则
      jsdoc.configs['flat/recommended'], // ✅ JSDoc 扁平插件配置对象
    ],
    rules: {
      'jsdoc/no-undefined-types': 'off', // JSDoc 里的泛型会报错
      'jsdoc/require-returns': 'off', // 关闭 JSDoc 缺少返回值规则
      'jsdoc/require-returns-type': 'off', // 关闭 JSDoc 缺少返回值类型规则
      'jsdoc/require-param-type': 'off', // 关闭 JSDoc 缺少参数类型规则
      '@typescript-eslint/no-unused-expressions': 'off', // 关闭未使用表达式校验，开启React常用的短路规则可能误判
      '@typescript-eslint/no-unused-vars': ['warn'], // 警告未使用变量 如遇到 与tsconfig.json 冲突，以ts为准
    },
  },
]);
