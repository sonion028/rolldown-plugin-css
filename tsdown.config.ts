import { defineConfig, type UserConfig } from 'tsdown';
import path from 'path';

const shared = {
  alias: {
    '@': path.resolve(import.meta.dirname, 'src'),
  },
  entry: {
    index: 'src/index.ts',
  },
  // 外部依赖配置 原external
  deps: {
    neverBundle: ['node', 'rolldown'],
  },
  // 输出配置
  format: 'esm', // 输出 ESM, node环境支持 require(ESM)
  target: 'es2022',
  platform: 'node', // 面向 Node.js，同时让 ESM 输出 .js 而非 .mjs
  outDir: 'dist',
  clean: true,
  // 构建优化
  minify: false, // 库构建通常不压缩
  treeshake: true, // 启用 tree-shaking
} satisfies UserConfig;

export default defineConfig([
  {
    ...shared,
    // 不生成类型声明文件
    dts: false,
    outputOptions: {
      entryFileNames: '[name].[format].js', // 不用后缀
      chunkFileNames: 'js/[name].[hash].js', // 除入口外的 chunk 文件放js文件夹
    },
  },
  {
    ...shared,
    outDir: 'dist/types', // ✅ 关键：给 dts 任务单独设置 outDir
    dts: {
      emitDtsOnly: true, // ✅ 只输出 .d.ts，不重复生成 JS
    },
  },
]);
