import path from 'node:path';
import type { Plugin, NormalizedOutputOptions, OutputBundle } from 'rolldown';
import type { TransformOptions, Targets, CustomAtRules } from 'lightningcss';
import { CSS_RE, SASS_RE, LESS_RE, CSS_MOD_RE } from '@/constant';
import { loadSass, loadLess } from '@/loader';

// Ensure lightningcss is installed
const { transform, Features } = await import('lightningcss').catch(() => {
  throw new Error(
    '[rolldown-plugin-css] ⚠️ lightningcss not installed. npm install -D lightningcss'
  );
});

export interface CSSPluginOptions<C extends CustomAtRules> extends Omit<
  TransformOptions<C>,
  'filename' | 'code' | 'sourceMap'
> {
  /** @default Features.Nesting | Features.CustomMediaQueries */
  include?: number;
  /**
   * Relative subdirectory under the output directory where CSS files will be emitted.
   * Set to empty string '' to output directly to the root directory.
   * @default 'css'
   */
  cssDir?: string;
}

const slash = (p: string) => p.replace(/\\/g, '/');

/**
 * @author sonion
 * @description CSS plugin for processing CSS files with preprocessing, LightningCSS transforms, and automatic CSS injection.
 * @param {CSSPluginOptions} options - Plugin configuration options.
 */
export function cssRolldown(
  options: CSSPluginOptions<CustomAtRules> = {}
): Plugin {
  const { cssDir = 'css', ...lightningOptions } = options;

  const cssRecords = new Map<string, string>();

  return {
    name: 'rolldown-css-plugin',

    async transform(code, id) {
      const cleanId = id.split('?')[0] as string; // 没必要rolldown不支持query参数
      if (!CSS_RE.test(cleanId)) return null;

      const isModule = CSS_MOD_RE.test(cleanId);

      let cssSource = code;
      let inputSourceMap: string | undefined;

      if (SASS_RE.test(cleanId)) {
        const sass = await loadSass();
        const r = sass.compileString(code, {
          syntax: cleanId.endsWith('.sass') ? 'indented' : 'scss',
          sourceMap: true,
          sourceMapIncludeSources: true,
          url: new URL(`file://${cleanId}`),
          loadPaths: [path.dirname(cleanId), 'node_modules'],
        });
        cssSource = r.css;
        if (r.sourceMap) inputSourceMap = JSON.stringify(r.sourceMap);
      } else if (LESS_RE.test(cleanId)) {
        const less = await loadLess();
        const r = await less.render(code, {
          filename: cleanId,
          sourceMap: { sourceMapFileInline: false },
          paths: [path.dirname(cleanId), 'node_modules'],
        });
        cssSource = r.css;
        if (r.map) inputSourceMap = r.map;
      }

      const filename = path.relative(process.cwd(), cleanId);
      const lcOpts: TransformOptions<CustomAtRules> = {
        minify: false,
        cssModules: isModule,
        sourceMap: true,
        include: Features.Nesting | Features.CustomMediaQueries,
        ...lightningOptions,
        filename,
        code: Buffer.from(cssSource),
        ...(inputSourceMap ? { inputSourceMap } : {}),
      };

      const { code: out, exports: cssExports, map } = transform(lcOpts);
      cssRecords.set(cleanId, out.toString());

      if (isModule && cssExports) {
        const classMap: Record<string, string> = {};
        for (const [local, info] of Object.entries(cssExports))
          classMap[local] = (info as { name: string }).name;
        const sm = map
          ? `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(map.toString()).toString('base64')}`
          : '';
        return {
          code: `const classes = ${JSON.stringify(classMap, null, 2)};\nexport default classes;${sm}`,
          map: null,
          moduleSideEffects: true,
        };
      }

      return {
        code: `/* css-plugin: ${filename} */`,
        map: null,
        moduleSideEffects: true,
      };
    },

    generateBundle(opts: NormalizedOutputOptions, bundle: OutputBundle) {
      if (cssRecords.size === 0) return;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;

        const cssIds = Object.keys(chunk.modules).filter((id) =>
          cssRecords.has(id)
        );
        if (cssIds.length === 0) continue;
        const css = cssIds.map((id) => cssRecords.get(id)!).join('\n');

        const baseName = `${
          chunk.isEntry && chunk.name
            ? chunk.name
            : path.basename(chunk.fileName, path.extname(chunk.fileName))
        }.css`;
        const cssFileName = cssDir ? `${cssDir}/${baseName}` : baseName;
        this.emitFile({ type: 'asset', fileName: cssFileName, source: css });

        // 注入 import CSS 语句
        const jsDir = path.dirname(chunk.fileName);
        const rel = slash(path.relative(jsDir, cssFileName));
        const importPath = rel.startsWith('.') ? rel : `./${rel}`;

        const importStmt =
          opts.format === 'cjs'
            ? `require('${importPath}');\n`
            : `import '${importPath}';\n`;
        chunk.code = importStmt + chunk.code;
      }
    },
  };
}

export { Features };
export type { Targets, CustomAtRules };
export default cssRolldown;
