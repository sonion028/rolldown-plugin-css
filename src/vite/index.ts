import fs from 'node:fs';
import path from 'node:path';
import {
  createVirtualId,
  isVirtualId,
  parseCSSRequest,
  toRealId,
} from '@/utils';
import type { Plugin } from 'vite';
import cssRolldown, { type CSSPluginOptions } from '@/core';
import type { CustomAtRules } from 'lightningcss';

type RolldownPlugin = Pick<
  ReturnType<typeof cssRolldown>,
  'transform' | 'generateBundle'
>;

type RolldownPluginFnType = {
  [F in keyof RolldownPlugin]: RolldownPlugin[F] &
    ((...args: unknown[]) => unknown);
};

const getHookHandler = <T>(hook: T | { handler: T }): T =>
  typeof hook === 'object' && hook !== null && 'handler' in hook
    ? hook.handler
    : hook;

const splitRequest = (id: string) => {
  const queryIndex = id.indexOf('?');
  if (queryIndex < 0) return { pathname: id, query: '' };
  return { pathname: id.slice(0, queryIndex), query: id.slice(queryIndex) };
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
  const rolldownTransform = getHookHandler(
    rolldownPlugin.transform as NonNullable<RolldownPlugin['transform']>
  ) as NonNullable<RolldownPluginFnType['transform']>;
  const rolldownGenerateBundle = getHookHandler(
    rolldownPlugin.generateBundle as NonNullable<
      RolldownPlugin['generateBundle']
    >
  ) as NonNullable<RolldownPluginFnType['generateBundle']>;

  return {
    name: 'rolldown-css-plugin',
    enforce: 'pre', // 确保内部 CSS 插件之前执行
    apply: 'build', // 仅构建阶段运行，开发环境由 Vite 自行处理 CSS

    resolveId(id, importer) {
      const request = parseCSSRequest(id);
      if (!request || request.isComponentStyle || !importer) return;
      const { pathname, query } = splitRequest(id);
      const resolved = `${path.resolve(path.dirname(importer.split('?')[0]!), pathname)}${query}`;
      return createVirtualId(resolved);
    },

    async load(id) {
      if (!isVirtualId(id)) return;
      const realId = toRealId(id);
      const request = parseCSSRequest(realId);
      if (!request) return;
      try {
        const code = await fs.promises.readFile(request.filePath, 'utf-8');
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
