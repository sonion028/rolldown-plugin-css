import fs from 'node:fs';
import path from 'node:path';
import { createVirtualId, isVirtualId, toRealId } from '@/utils';
import type { Plugin } from 'vite';
import cssRolldown, { type CSSPluginOptions } from '@/core';
import type { CustomAtRules } from 'lightningcss';
import { CSS_RE } from '@/constant';

type RolldownPlugin = Pick<
  ReturnType<typeof cssRolldown>,
  'transform' | 'generateBundle'
>;

type RolldownPluginFnType = {
  [F in keyof RolldownPlugin]: RolldownPlugin[F] &
    ((...args: unknown[]) => unknown);
};

/**
 * @description CSS plugin for Vite build. Uses `resolveId` + `load` to intercept CSS as virtual modules,
 * preventing Vite's internal CSS handling from producing duplicate output.
 * Delegates transform/generateBundle to cssRolldown with real IDs.
 * @param {CSSPluginOptions} options - Plugin configuration options.
 */
function cssVite(options: CSSPluginOptions<CustomAtRules> = {}): Plugin {
  const rolldownPlugin = cssRolldown(options);

  // 从 ObjectHook 中提取实际的 handler 函数
  const rolldownTransform = rolldownPlugin.transform as NonNullable<
    RolldownPluginFnType['transform']
  >;
  const rolldownGenerateBundle = rolldownPlugin.generateBundle as NonNullable<
    RolldownPluginFnType['generateBundle']
  >;

  return {
    name: 'rolldown-css-plugin',
    enforce: 'pre', // 确保内部 CSS 插件之前执行
    apply: 'build', // 仅构建阶段运行，开发环境由 Vite 自行处理 CSS

    resolveId(id, importer) {
      const cleanId = id.split('?')[0]; // 处理 query 参数
      if (!cleanId || !CSS_RE.test(cleanId) || !importer) return;
      const resolved = path.resolve(path.dirname(importer), id);
      return createVirtualId(resolved);
    },

    async load(id) {
      if (!isVirtualId(id)) return;
      const realId = toRealId(id);
      try {
        const code = await fs.promises.readFile(realId, 'utf-8');
        return { code, moduleSideEffects: true };
      } catch {
        return;
      }
    },

    async transform(code, id) {
      if (!isVirtualId(id)) return;
      const realId = toRealId(id);
      return rolldownTransform?.call(this, code, realId);
    },

    generateBundle(opts, bundle) {
      // chunk.modules 的 key 是虚拟 ID，补上真实 ID 的映射让 cssRolldown 能匹配
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const id of Object.keys(chunk.modules)) {
          if (!isVirtualId(id)) continue;
          chunk.modules[id] &&
            (chunk.modules[toRealId(id)] = chunk.modules[id]);
        }
      }
      return rolldownGenerateBundle?.call(this, opts, bundle);
    },
  } as Plugin;
}

export default cssVite;
