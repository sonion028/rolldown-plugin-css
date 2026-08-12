import path from 'node:path';
import type { Plugin, NormalizedOutputOptions, OutputBundle } from 'rolldown';
import type { TransformOptions, CustomAtRules } from 'lightningcss';
import { CSS_REQUEST_RE } from '@/constant';
import { parseCSSRequest, slash } from '@/utils';
import { loadSass, loadLess } from '@/preprocessor';
import { transform, Features } from '@/transform';

export interface CSSPluginOptions<C extends CustomAtRules> extends Omit<
  TransformOptions<C>,
  'filename' | 'code'
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

/**
 * @author sonion
 * @description CSS plugin for processing CSS files with preprocessing, LightningCSS transforms, and automatic CSS injection.
 * @param {CSSPluginOptions} options - Plugin configuration options.
 */
function cssRolldown(options: CSSPluginOptions<CustomAtRules> = {}): Plugin {
  const { cssDir = 'css', sourceMap, ...lightningOptions } = options;

  const cssRecords = new Map<string, { css: string; map?: string }>();

  return {
    name: 'rolldown-css-plugin',

    // watch 模式下，每次构建前清空缓存
    buildStart() {
      cssRecords.clear();
    },

    transform: {
      filter: { id: CSS_REQUEST_RE },
      async handler(code, id) {
        const request = parseCSSRequest(id);
        if (!request) return;

        let cssSource = code;
        let inputSourceMap: string | undefined;

        if (request.lang === 'scss' || request.lang === 'sass') {
          const sass = await loadSass();
          const r = sass.compileString(code, {
            syntax: request.lang === 'sass' ? 'indented' : 'scss',
            ...(sourceMap
              ? { sourceMap: true, sourceMapIncludeSources: true }
              : {}),
            url: new URL(`file://${request.filePath}`),
            loadPaths: [path.dirname(request.filePath), 'node_modules'],
          });
          cssSource = r.css;
          if (sourceMap && r.sourceMap)
            inputSourceMap = JSON.stringify(r.sourceMap);
        } else if (request.lang === 'less') {
          const less = await loadLess();
          const r = await less.render(code, {
            filename: request.filePath,
            ...(sourceMap
              ? {
                  sourceMap: {
                    sourceMapFileInline: false,
                    outputSourceFiles: true,
                  },
                }
              : {}),
            paths: [path.dirname(request.filePath), 'node_modules'],
          });
          cssSource = r.css;
          if (sourceMap && r.map) inputSourceMap = r.map;
        }

        const filename = path.relative(process.cwd(), request.filename);
        const lcOpts: TransformOptions<CustomAtRules> = {
          minify: false,
          cssModules: request.isModule,
          include: Features.Nesting | Features.CustomMediaQueries,
          sourceMap,
          ...lightningOptions,
          filename,
          code: Buffer.from(cssSource),
          ...(inputSourceMap ? { inputSourceMap } : {}),
        };

        const { code: out, exports: cssExports, map } = transform(lcOpts);
        cssRecords.set(request.id, {
          css: out.toString(),
          ...(sourceMap && map ? { map: map.toString() } : {}),
        });

        if (request.isModule && cssExports) {
          const classMap: Record<string, string> = {};
          for (const [local, info] of Object.entries(cssExports))
            classMap[local] = info.name;
          return {
            code: `const classes = ${JSON.stringify(classMap, null, 2)};\nexport default classes;`,
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
    },

    generateBundle(opts: NormalizedOutputOptions, bundle: OutputBundle) {
      if (!cssRecords.size) return;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;

        const cssIds = Object.keys(chunk.modules).filter((id) =>
          cssRecords.has(id)
        );
        if (!cssIds?.length) continue;

        const records = cssIds.map((id) => cssRecords.get(id)!);
        const css = records.map((r) => r.css).join('\n');
        // 合并 chunk 要合并 sourceMap，暂不支持
        const sourceMap =
          records.length === 1 && records[0] ? records[0].map : void 0;

        const baseName = `${
          chunk.isEntry && chunk.name
            ? chunk.name
            : path.basename(chunk.fileName, path.extname(chunk.fileName))
        }.css`;
        const cssFileName = cssDir ? `${cssDir}/${baseName}` : baseName;
        // 生成 sourceMap 文件
        sourceMap &&
          this.emitFile({
            type: 'asset',
            fileName: `${cssFileName}.map`,
            source: sourceMap,
          });
        const sourceMappingURL = !sourceMap
          ? ''
          : `\n/*# sourceMappingURL=${slash(path.relative(path.dirname(cssFileName), `${cssFileName}.map`))} */`;
        this.emitFile({
          type: 'asset',
          fileName: cssFileName,
          source: `${css}${sourceMappingURL}`,
        });

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

export default cssRolldown;
